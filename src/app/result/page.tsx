import { prisma } from '@/src/lib/prisma';
import { getSession } from '@/src/lib/session';
import { calculateGenmeiId } from '@/src/lib/zodiacCalc';
import { computeMeishikiFromBirth } from '@/src/lib/meishikiCalc';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/src/app/actions/auth';
import { ShichusuimeiSection } from '@/src/components/fortune/ShichusuimeiSection';
import { WesternAstrologySection } from '@/src/components/fortune/WesternAstrologySection';
import { DirectionLifeSection } from '@/src/components/fortune/DirectionLifeSection';
import { ResultTabs } from '@/src/components/fortune/ResultTabs';
import { TransitSection } from '@/src/components/fortune/TransitSection';
import { SynastryTab } from '@/src/components/fortune/SynastryTab';
import { AdminTabNav } from '@/src/components/admin/AdminTabNav';
import { synastryFromBirth } from '@/src/lib/astrology/synastry-server';

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ compat?: string }>;
}) {
  const { compat: compatPartnerId } = await searchParams;
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
  });
  if (!user) {
    redirect('/login');
  }

  const zodiac = user.zodiacDayId
    ? await prisma.zodiac.findUnique({ where: { id: user.zodiacDayId } })
    : null;

  if (!zodiac) {
    notFound();
  }

  const genmeiId =
    user.genmeiId ??
    calculateGenmeiId(user.birthday.toISOString().split('T')[0]);

  const genmei = await prisma.genmeiData.findUnique({ where: { id: genmeiId } });

  // 命式図（四柱）— 生年月日はJSTの暦日で解釈（保存済みの日柱・元命と一致させる）
  const meishiki = computeMeishikiFromBirth(user.birthday, user.birthTime);

  // 相性タブ: 管理者は登録済みの人（占断履歴）から相手を選べる
  const compatPeople =
    user.role === 'admin'
      ? (
          await prisma.fortuneHistory.findMany({
            where: { adminUserId: user.id },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, birthday: true, birthTime: true, birthCity: true },
          })
        ).map((h) => ({
          id: h.id,
          name: h.name,
          birthday: h.birthday.toISOString(),
          birthTime: h.birthTime,
          birthCity: h.birthCity,
        }))
      : undefined;

  // 相性タブ: 会員（管理者以外）は自分の相性履歴（最大10件、点数つき）を見られる
  const selfBirth = {
    birthday: user.birthday.toISOString(),
    birthTime: user.birthTime,
    birthCity: user.birthCity,
  };
  const compatHistoryItems =
    user.role !== 'admin'
      ? (
          await prisma.compatHistory.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            take: 10,
          })
        ).map((h) => {
          const r = synastryFromBirth(selfBirth, {
            birthday: h.birthday.toISOString(),
            birthTime: h.birthTime,
            birthCity: h.birthCity,
          });
          return {
            id: h.id,
            name: h.name,
            birthday: h.birthday.toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' }), // YYYY-MM-DD
            birthdayLabel: h.birthday.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            birthTime: h.birthTime,
            birthCity: h.birthCity,
            total: r.total,
            love: r.categories.恋愛,
            work: r.categories.仕事,
            friend: r.categories.友人,
          };
        })
      : undefined;

  return (
    <div className="min-h-screen bg-[#07071A] text-white">

      {/* 背景グロー */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">

        {user.role === 'admin' && <AdminTabNav active="self" />}

        {/* ページヘッダー */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-slate-400">{user.nickname}さんの</p>
            <h1 className="text-3xl font-bold text-white">占い結果</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="mt-1 w-10 h-10 rounded-xl bg-[#1a1a3a] border border-purple-900/50 flex items-center justify-center text-purple-400 hover:border-purple-500/70 hover:text-purple-300 transition-all"
              title="会員情報"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── タブ ── */}
        <ResultTabs
          openCompat={!!compatPartnerId}
          shichu={
            <ShichusuimeiSection
              nickname={user.nickname}
              zodiac={zodiac}
              genmei={genmei}
              meishiki={meishiki}
            />
          }
          western={
            <WesternAstrologySection
              birthday={user.birthday}
              birthTime={user.birthTime}
              birthCity={user.birthCity}
            />
          }
          life={
            <DirectionLifeSection
              birthday={user.birthday}
              birthTime={user.birthTime}
              birthCity={user.birthCity}
            />
          }
          transit={
            <TransitSection
              birthday={user.birthday}
              birthTime={user.birthTime}
              birthCity={user.birthCity}
            />
          }
          compat={
            <SynastryTab
              selfBirthday={user.birthday.toISOString()}
              selfBirthTime={user.birthTime}
              selfBirthCity={user.birthCity}
              people={compatPeople}
              preselectId={compatPartnerId}
              isAdmin={user.role === 'admin'}
              historyItems={compatHistoryItems}
            />
          }
        />

        {/* ── フッター ── */}
        <div className="flex justify-between items-center px-1 pt-2 pb-4">
          <Link
            href="/"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            ← トップへ戻る
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-slate-600 hover:text-slate-400 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
