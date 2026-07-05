import { ZodiacSection } from './ZodiacSection'
import { GenmeiSection } from './GenmeiSection'
import { MeishikiChart } from './MeishikiChart'
import type { Meishiki } from '@/src/lib/meishikiCalc'

type ShichusuimeiSectionProps = {
  nickname: string
  zodiac: {
    name: string
    title: string
    description: string[]
  }
  genmei: {
    name: string
    title: string
    description: string[]
  } | null
  meishiki?: Meishiki | null
}

export function ShichusuimeiSection({ nickname, zodiac, genmei, meishiki }: ShichusuimeiSectionProps) {
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
