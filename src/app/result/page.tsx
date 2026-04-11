import { prisma } from '@/src/lib/prisma';
import { getSession } from '@/src/lib/session';
import { calculateGenmeiId } from '@/src/lib/zodiacCalc';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/src/app/actions/auth';

export default async function ResultPage() {
  // 認証チェック
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }

  // ログインユーザー取得
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
  });
  if (!user) {
    redirect('/login');
  }

  // 日柱データ取得
  const zodiac = user.zodiacDayId
    ? await prisma.zodiac.findUnique({ where: { id: user.zodiacDayId } })
    : null;

  if (!zodiac) {
    notFound();
  }

  // 元命ID: DBに保存済みならそれを使い、なければ誕生日から計算
  const genmeiId =
    user.genmeiId ??
    calculateGenmeiId(user.birthday.toISOString().split('T')[0]);

  const genmei = await prisma.genmeiData.findUnique({ where: { id: genmeiId } });

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ─── 日柱セクション ─────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center text-white">
            <p className="text-indigo-200 text-xs font-medium tracking-widest mb-2">日柱</p>
            <p className="text-indigo-100 text-sm font-medium mb-2">あなたの性格は...?</p>
            <h1 className="text-5xl font-bold mb-4">{zodiac.name}</h1>
            <p className="text-lg text-indigo-50 font-medium leading-relaxed">
              {zodiac.title}
            </p>
          </div>
          <div className="p-8 md:p-12">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-indigo-500 pl-4">
              {user.nickname}さんの主な性格の特徴
            </h2>
            <ul className="space-y-3">
              {zodiac.description.map((item, index) => (
                <li key={index} className="flex items-start text-slate-700">
                  <span className="text-indigo-400 mr-2 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── 元命セクション ─────────────────────────── */}
        {genmei && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-violet-600 p-8 text-center text-white">
              <p className="text-violet-200 text-xs font-medium tracking-widest mb-2">元命（月柱の中心星）</p>
              <p className="text-violet-100 text-sm font-medium mb-2">あなたの中心にある星は...?</p>
              <h2 className="text-5xl font-bold mb-4">{genmei.name}</h2>
              <p className="text-lg text-violet-50 font-medium leading-relaxed">
                {genmei.title}
              </p>
            </div>
            <div className="p-8 md:p-12">
              <h3 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-violet-500 pl-4">
                {user.nickname}さんの元命の特徴
              </h3>
              <ul className="space-y-3">
                {genmei.description.map((item, index) => (
                  <li key={index} className="flex items-start text-slate-700">
                    <span className="text-violet-400 mr-2 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ─── フッター ───────────────────────────────── */}
        <div className="flex justify-between items-center px-2 pb-4">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors"
          >
            ← トップへ戻る
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
