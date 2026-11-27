import { CharacterFigure } from './CharacterFigure'
import { getTsuhenseiCharacter } from '@/src/data/character-master'

type GenmeiSectionProps = {
  nickname: string
  genmei: {
    /** 通変星ID 1〜10（キャラの取得に使う） */
    id: number
    name: string
    title: string
    description: string[]
  }
}

export function GenmeiSection({ nickname, genmei }: GenmeiSectionProps) {
  const character = getTsuhenseiCharacter(genmei.id)

  return (
    <div className="p-6">
      {/* 一般の人向けの見出しと説明を先に、専門用語はおまけで小さく */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-violet-500" />
          <p className="text-sm text-violet-300 font-bold tracking-wide">あなたの芯にある性格</p>
          <span className="ml-auto text-[10px] text-slate-600 tracking-wider">四柱推命｜通変星（元命）</span>
        </div>
        <p className="mt-2 pl-3 text-xs text-slate-400 leading-relaxed">
          心の奥にあって、あなたらしさの軸になっている性格です。
        </p>
      </div>
      <div className="text-center mb-6">
        <p className="text-slate-500 text-xs mb-2">あなたの中心にある星は…?</p>
        <h2 className="text-3xl font-bold text-white mb-3">{genmei.name}</h2>
        <p className="text-violet-300 text-sm font-medium">{genmei.title}</p>
        {character && <CharacterFigure character={character} glow="rgba(139, 92, 246, 0.35)" />}
      </div>
      <div>
        <p className="text-xs text-slate-600 mb-3">{nickname}さんの芯にある性格の特徴</p>
        <ul className="space-y-2.5">
          {genmei.description.map((item, index) => (
            <li key={index} className="flex items-start text-slate-300 text-sm leading-relaxed">
              <span className="text-violet-500 mr-2 mt-0.5 shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
