import { prisma } from '@/src/lib/prisma';
import { getSession } from '@/src/lib/session';
import { calculateGenmeiId } from '@/src/lib/zodiacCalc';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/src/app/actions/auth';
import { ZodiacSection } from '@/src/components/fortune/ZodiacSection';
import { GenmeiSection } from '@/src/components/fortune/GenmeiSection';

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
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        <ZodiacSection nickname={user.nickname} zodiac={zodiac} />

        {genmei && <GenmeiSection nickname={user.nickname} genmei={genmei} />}

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
