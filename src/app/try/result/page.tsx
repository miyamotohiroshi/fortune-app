import { prisma } from '@/src/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ZodiacSection } from '@/src/components/fortune/ZodiacSection'
import { GenmeiSection } from '@/src/components/fortune/GenmeiSection'

export default async function TryResultPage({
  searchParams,
}: {
  searchParams: Promise<{ zodiacId?: string; genmeiId?: string; nickname?: string; birthday?: string }>
}) {
  const { zodiacId: zodiacIdStr, genmeiId: genmeiIdStr, nickname, birthday } = await searchParams

  const zodiacId = zodiacIdStr ? parseInt(zodiacIdStr) : null
  const genmeiId = genmeiIdStr ? parseInt(genmeiIdStr) : null
  const displayName = nickname ? decodeURIComponent(nickname) : 'あなた'

  // 会員登録リンクに試し占いで入力した名前・生年月日を引き継ぐ
  const signupParams = new URLSearchParams()
  if (nickname) signupParams.set('nickname', nickname)
  if (birthday) signupParams.set('birthday', birthday)
  const signupUrl = `/?${signupParams.toString()}`

  if (!zodiacId || !genmeiId || isNaN(zodiacId) || isNaN(genmeiId)) {
    notFound()
  }

  const [zodiac, genmei] = await Promise.all([
    prisma.zodiac.findUnique({ where: { id: zodiacId } }),
    prisma.genmeiData.findUnique({ where: { id: genmeiId } }),
  ])

  if (!zodiac) notFound()

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        <ZodiacSection nickname={displayName} zodiac={zodiac} />

        {genmei && <GenmeiSection nickname={displayName} genmei={genmei} />}

        {/* ─── フッター ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-3">
          <p className="text-slate-600 text-sm">
            診断結果を保存して、いつでも見返しませんか？
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={signupUrl}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              会員登録する
            </Link>
            <Link
              href="/login"
              className="border border-slate-300 hover:border-slate-400 text-slate-600 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              ログイン
            </Link>
          </div>
          <div className="pt-2">
            <Link
              href="/try"
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← 別の生年月日で試す
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
