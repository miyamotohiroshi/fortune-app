import { prisma } from '@/src/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShichusuimeiSection } from '@/src/components/fortune/ShichusuimeiSection'

export default async function TryResultPage({
  searchParams,
}: {
  searchParams: Promise<{ zodiacId?: string; genmeiId?: string; nickname?: string; birthday?: string }>
}) {
  const { zodiacId: zodiacIdStr, genmeiId: genmeiIdStr, nickname, birthday } = await searchParams

  const zodiacId = zodiacIdStr ? parseInt(zodiacIdStr) : null
  const genmeiId = genmeiIdStr ? parseInt(genmeiIdStr) : null
  const displayName = nickname ? decodeURIComponent(nickname) : 'あなた'

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
    <div className="min-h-screen bg-[#07071A] text-white">

      {/* 背景グロー */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">

        {/* ページヘッダー */}
        <div className="mb-2">
          <p className="text-xs text-purple-400 tracking-widest mb-1">無料体験 / 鑑定結果</p>
          <h1 className="text-2xl font-bold text-white">
            {displayName}さんの星を読み解きます
          </h1>
        </div>

        {/* ── 四柱推命セクション ── */}
        <ShichusuimeiSection
          nickname={displayName}
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

        {/* ── フッター CTA ── */}
        <div
          className="rounded-2xl border border-purple-900/30 p-6 text-center space-y-4"
          style={{ background: 'rgba(12,12,34,0.95)' }}
        >
          <p className="text-sm text-slate-400">
            診断結果を保存して、いつでも見返しませんか？
          </p>
          <div className="flex gap-3 justify-center">
            {/* 会員登録ボタン（グラデーションボーダー） */}
            <div
              className="rounded-xl p-px"
              style={{ background: 'linear-gradient(to right, #d946ef, #8b5cf6, #4f46e5)' }}
            >
              <Link
                href={signupUrl}
                className="block text-sm font-medium text-white px-5 py-2.5 rounded-[11px] hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(to right, #2e1065, #1e1b4b)' }}
              >
                会員登録する
              </Link>
            </div>
            <Link
              href="/login"
              className="border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-300 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              ログイン
            </Link>
          </div>
          <Link
            href="/try"
            className="block text-xs text-slate-600 hover:text-slate-400 transition-colors pt-1"
          >
            ← 別の生年月日で試す
          </Link>
        </div>

      </div>
    </div>
  )
}
