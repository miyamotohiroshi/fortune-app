import { prisma } from '@/src/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShichusuimeiSection } from '@/src/components/fortune/ShichusuimeiSection'
import { WesternAstrologySection } from '@/src/components/fortune/WesternAstrologySection'
import { DirectionLifeSection } from '@/src/components/fortune/DirectionLifeSection'
import { ResultTabs } from '@/src/components/fortune/ResultTabs'
import { TransitSection } from '@/src/components/fortune/TransitSection'
import { SynastryTab } from '@/src/components/fortune/SynastryTab'
import { computeMeishiki } from '@/src/lib/meishikiCalc'

export default async function TryResultPage({
  searchParams,
}: {
  searchParams: Promise<{
    zodiacId?: string
    genmeiId?: string
    nickname?: string
    birthday?: string
    birthTime?: string
    birthCity?: string
  }>
}) {
  const { zodiacId: zodiacIdStr, genmeiId: genmeiIdStr, nickname, birthday: birthdayRaw, birthTime, birthCity } = await searchParams

  const zodiacId = zodiacIdStr ? parseInt(zodiacIdStr) : null
  const genmeiId = genmeiIdStr ? parseInt(genmeiIdStr) : null
  const displayName = nickname ?? 'あなた'

  if (!zodiacId || !genmeiId || isNaN(zodiacId) || isNaN(genmeiId) || !birthdayRaw) {
    notFound()
  }

  // YYYYMMDD → Date
  const y = parseInt(birthdayRaw.slice(0, 4), 10)
  const m = parseInt(birthdayRaw.slice(4, 6), 10) - 1
  const d = parseInt(birthdayRaw.slice(6, 8), 10)
  const birthday = new Date(y, m, d)

  // 命式図（四柱）— m は 0 始まりなので +1 して渡す
  const birthHour = birthTime ? parseInt(birthTime.split(':')[0], 10) : null
  const meishiki = computeMeishiki(y, m + 1, d, Number.isNaN(birthHour as number) ? null : birthHour)

  const signupParams = new URLSearchParams()
  if (displayName && displayName !== 'あなた') signupParams.set('nickname', displayName)
  if (birthdayRaw) signupParams.set('birthday', birthdayRaw)
  if (birthTime) signupParams.set('birthTime', birthTime)
  if (birthCity) signupParams.set('birthCity', birthCity)
  const signupUrl = `/?${signupParams.toString()}`

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
          <p className="text-sm text-slate-400">{displayName}さんの</p>
          <h1 className="text-3xl font-bold text-white">占い結果</h1>
        </div>

        {/* タブ */}
        <ResultTabs
          shichu={
            <ShichusuimeiSection
              nickname={displayName}
              zodiac={zodiac}
              genmei={genmei}
              meishiki={meishiki}
            />
          }
          western={
            <WesternAstrologySection
              birthday={birthday}
              birthTime={birthTime ?? null}
              birthCity={birthCity ?? null}
            />
          }
          life={
            <DirectionLifeSection
              birthday={birthday}
              birthTime={birthTime ?? null}
              birthCity={birthCity ?? null}
            />
          }
          transit={
            <TransitSection
              birthday={birthday}
              birthTime={birthTime ?? null}
              birthCity={birthCity ?? null}
            />
          }
          compat={
            <SynastryTab
              selfBirthday={birthday.toISOString()}
              selfBirthTime={birthTime ?? null}
              selfBirthCity={birthCity ?? null}
            />
          }
        />

        {/* フッター CTA */}
        <div
          className="rounded-2xl border border-purple-900/30 p-6 text-center space-y-4"
          style={{ background: 'rgba(12,12,34,0.95)' }}
        >
          <p className="text-sm text-slate-400">
            診断結果を保存して、いつでも見返しませんか？
          </p>
          <div className="flex gap-3 justify-center">
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
