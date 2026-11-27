import Image from 'next/image'
import type { Character } from '@/src/data/character-master'

type CharacterFigureProps = {
  character: Character
  /** 光彩の色（セクションのアクセントに合わせる） */
  glow: string
}

/**
 * 結果ページで占い結果のキャラ画像を表示する。
 * キャラ名・説明文はユーザー向けには出さない（管理者用のキャラ一覧で表示する想定）
 */
export function CharacterFigure({ character, glow }: CharacterFigureProps) {
  return (
    <div className="flex justify-center mt-5">
      <div
        className="relative w-44 h-44 rounded-3xl overflow-hidden ring-1 ring-white/10"
        style={{ boxShadow: `0 0 48px ${glow}` }}
      >
        <Image
          src={character.src}
          alt={`${character.name}（${character.motif}）`}
          width={512}
          height={512}
          sizes="176px"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
