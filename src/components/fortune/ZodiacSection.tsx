import { CharacterFigure } from './CharacterFigure'
import { getKanshiCharacter } from '@/src/data/character-master'

type ZodiacSectionProps = {
  nickname: string
  zodiac: {
    /** 干支ID 1〜60（キャラの取得に使う） */
    id: number
    name: string
    title: string
    description: string[]
  }
}

export function ZodiacSection({ nickname, zodiac }: ZodiacSectionProps) {
  const character = getKanshiCharacter(zodiac.id)

  return (
    <div className="p-6">
      {/* 一般の人向けの見出しと説明を先に、専門用語はおまけで小さく */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-indigo-500" />
          <p className="text-sm text-indigo-300 font-bold tracking-wide">生まれ持った性格</p>
          <span className="ml-auto text-[10px] text-slate-600 tracking-wider">四柱推命｜日柱</span>
        </div>
        <p className="mt-2 pl-3 text-xs text-slate-400 leading-relaxed">
          あなたの素の性格や本質です。
        </p>
      </div>
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-3">{zodiac.name}</h2>
        <p className="text-indigo-300 text-sm font-medium">{zodiac.title}</p>
        {character && <CharacterFigure character={character} glow="rgba(99, 102, 241, 0.35)" />}
      </div>
      <div>
        <p className="text-xs text-slate-600 mb-3">{nickname}さんの主な性格の特徴</p>
        <ul className="space-y-2.5">
          {zodiac.description.map((item, index) => (
            <li key={index} className="flex items-start text-slate-300 text-sm leading-relaxed">
              <span className="text-indigo-500 mr-2 mt-0.5 shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
