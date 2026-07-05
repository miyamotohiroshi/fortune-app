import { prisma } from '@/src/lib/prisma'
import { getCurrentUser } from '@/src/lib/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShichusuimeiSection } from '@/src/components/fortune/ShichusuimeiSection'
import { WesternAstrologySection } from '@/src/components/fortune/WesternAstrologySection'
import { DirectionLifeSection } from '@/src/components/fortune/DirectionLifeSection'
import { ResultTabs } from '@/src/components/fortune/ResultTabs'
import { TransitSection } from '@/src/components/fortune/TransitSection'
import { AdminTabNav } from '@/src/components/admin/AdminTabNav'
import { computeMeishikiFromBirth } from '@/src/lib/meishikiCalc'

export default async function AdminHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  const history = await prisma.fortuneHistory.findUnique({ where: { id } })
  if (!history || history.adminUserId !== user!.id) {
    notFound()
  }

  const [zodiac, genmei] = await Promise.all([
    prisma.zodiac.findUnique({ where: { id: history.zodiacDayId } }),
    prisma.genmeiData.findUnique({ where: { id: history.genmeiId } }),
  ])

  if (!zodiac) notFound()

  // 命式図（四柱）— 生年月日はJSTの暦日で解釈（保存済みの日柱・元命と一致させる）
  const meishiki = computeMeishikiFromBirth(history.birthday, history.birthTime)

  return (
    <div className="min-h-screen bg-[#07071A] text-white">
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">

        <AdminTabNav active="history" />

        <div className="mb-2">
          <p className="text-xs text-purple-400 tracking-widest mb-1">占断履歴</p>
          <p className="text-sm text-slate-400">{history.name}さんの</p>
          <h1 className="text-3xl font-bold text-white">占い結果</h1>
        </div>

        <ResultTabs
          tab0={
            <ShichusuimeiSection
              nickname={history.name}
              zodiac={zodiac}
              genmei={genmei}
              meishiki={meishiki}
            />
          }
          tab1={
            <WesternAstrologySection
              birthday={history.birthday}
              birthTime={history.birthTime}
              birthCity={history.birthCity}
            />
          }
          tab2={
            <DirectionLifeSection
              birthday={history.birthday}
              birthTime={history.birthTime}
              birthCity={history.birthCity}
            />
          }
          tab3={
            <TransitSection
              birthday={history.birthday}
              birthTime={history.birthTime}
              birthCity={history.birthCity}
            />
          }
        />

        <div className="flex justify-between items-center px-1 pt-2 pb-4">
          <Link href="/admin/history" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            ← 履歴一覧へ戻る
          </Link>
          <Link href="/admin/lookup" className="text-sm text-slate-600 hover:text-slate-400 transition-colors">
            別の人を占う
          </Link>
        </div>

      </div>
    </div>
  )
}
