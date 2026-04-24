import { prisma } from '@/src/lib/prisma';
import { getSession } from '@/src/lib/session';
import { calculateGenmeiId } from '@/src/lib/zodiacCalc';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/src/app/actions/auth';
import { ShichusuimeiSection } from '@/src/components/fortune/ShichusuimeiSection';

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
        <div className="mb-2">
          <p className="text-xs text-purple-400 tracking-widest mb-1">鑑定結果</p>
          <h1 className="text-2xl font-bold text-white">
            {user.nickname}さんの星を読み解きます
          </h1>
        </div>

        {/* ── 四柱推命セクション ── */}
        <ShichusuimeiSection
          nickname={user.nickname}
          zodiac={zodiac}
          genmei={genmei}
        />

        {/* ── 西洋占星術セクション（近日公開）── */}
        <div
          className="rounded-2xl border border-slate-800/60 p-6 text-center"
          style={{ background: 'rgba(9,9,25,0.6)' }}
        >
          <p className="text-xs text-slate-700 tracking-widest mb-2 font-medium">COMING SOON</p>
          <h2 className="text-lg font-bold text-slate-600">西洋占星術</h2>
          <p className="text-xs text-slate-700 mt-2">現在開発中です。近日公開予定</p>
        </div>

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
