import { prisma } from '@/src/lib/prisma';
import { getSession } from '@/src/lib/session';
import { calculateGenmeiId } from '@/src/lib/zodiacCalc';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/src/app/actions/auth';
import { ShichusuimeiSection } from '@/src/components/fortune/ShichusuimeiSection';
import { WesternAstrologySection } from '@/src/components/fortune/WesternAstrologySection';
import { ResultTabs } from '@/src/components/fortune/ResultTabs';

export default async function ResultPage() {
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

  return (
    <div className="min-h-screen bg-[#07071A] text-white">

      {/* 背景グロー */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">

        {/* ページヘッダー */}
        <div className="mb-4">
          <p className="text-sm text-slate-400">{user.nickname}さんの</p>
          <h1 className="text-3xl font-bold text-white">占い結果</h1>
        </div>

        {/* ── タブ ── */}
        <ResultTabs
          tab0={
            <ShichusuimeiSection
              nickname={user.nickname}
              zodiac={zodiac}
              genmei={genmei}
            />
          }
          tab1={
            <WesternAstrologySection
              birthday={user.birthday}
              birthTime={user.birthTime}
              birthCity={user.birthCity}
            />
          }
          tab2={
            <div
              className="rounded-2xl border border-slate-800/40 p-8 text-center"
              style={{ background: 'rgba(9,9,25,0.6)' }}
            >
              <p className="text-sm text-slate-500">人生鑑定（西洋占星術）は準備中です</p>
            </div>
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
