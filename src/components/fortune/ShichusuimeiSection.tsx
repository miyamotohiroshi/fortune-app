import { ZodiacSection } from './ZodiacSection'
import { GenmeiSection } from './GenmeiSection'

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
}

export function ShichusuimeiSection({ nickname, zodiac, genmei }: ShichusuimeiSectionProps) {
  return (
    <div
      className="rounded-2xl p-px"
      style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 50%, #7c3aed 100%)' }}
    >
      <div className="rounded-[15px] overflow-hidden" style={{ background: 'rgba(9, 9, 25, 0.98)' }}>

        {/* セクションヘッダー */}
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(to right, rgba(88,28,135,0.5), rgba(67,56,202,0.3))' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-purple-400 text-sm">✦</span>
            <span className="text-white text-sm font-bold tracking-widest">四柱推命</span>
          </div>
          <div className="flex-1 h-px bg-purple-900/40" />
          <span className="text-xs text-purple-500 tracking-wider">SHICHUSUMEI</span>
        </div>

        {/* 日柱 */}
        <ZodiacSection nickname={nickname} zodiac={zodiac} />

        {/* 区切り線 */}
        {genmei && (
          <>
            <div className="mx-6 border-t border-purple-900/30" />
            <GenmeiSection nickname={nickname} genmei={genmei} />
          </>
        )}

      </div>
    </div>
  )
}
