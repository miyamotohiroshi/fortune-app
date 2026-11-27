import { ZodiacSection } from './ZodiacSection'
import { GenmeiSection } from './GenmeiSection'
import { MeishikiChart } from './MeishikiChart'
import { LoveSection } from './LoveSection'
import type { Meishiki } from '@/src/lib/meishikiCalc'
import { getLoveReading } from '@/src/data/love'

type ShichusuimeiSectionProps = {
  nickname: string
  zodiac: {
    /** 干支ID 1〜60（恋愛傾向の取得に使う） */
    id: number
    name: string
    title: string
    description: string[]
  }
  genmei: {
    /** 通変星ID 1〜10（キャラの取得に使う） */
    id: number
    name: string
    title: string
    description: string[]
  } | null
  meishiki?: Meishiki | null
}

export function ShichusuimeiSection({ nickname, zodiac, genmei, meishiki }: ShichusuimeiSectionProps) {
  const love = getLoveReading(zodiac.id)

  return (
    <div
      className="rounded-2xl p-px"
      style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 50%, #7c3aed 100%)' }}
    >
      <div className="rounded-[15px] overflow-hidden" style={{ background: 'rgba(9, 9, 25, 0.98)' }}>

        {/* 日柱 */}
        <ZodiacSection nickname={nickname} zodiac={zodiac} />

        {/* 区切り線 */}
        {genmei && (
          <>
            <div className="mx-6 border-t border-purple-900/30" />
            <GenmeiSection nickname={nickname} genmei={genmei} />
          </>
        )}

        {/* 恋愛傾向（日柱）。データ未作成の干支では出さない */}
        {love && (
          <>
            <div className="mx-6 border-t border-purple-900/30" />
            <LoveSection love={love} />
          </>
        )}

        {/* 命式図 */}
        {meishiki && (
          <>
            <div className="mx-6 border-t border-purple-900/30" />
            <MeishikiChart meishiki={meishiki} />
          </>
        )}

      </div>
    </div>
  )
}
