'use client'

import { buildLifePrompt, LIFE_PROMPT_MIN_IMPORTANCE } from '@/src/lib/astrology/life-prompt'
import type { LifePromptInput } from '@/src/lib/astrology/life-prompt'
import { PromptModalButton } from './PromptModalButton'

type Props = {
  input: Omit<LifePromptInput, 'mode'>
}

// 人生タブの一番下に置く「人生の概要をAIで読むためのプロンプト」ボタン。
// 長くなりすぎないよう「これまで（0歳〜昨年）」と「これから（今年〜100歳）」の2つに分ける
export function LifePromptButtons({ input }: Props) {
  const currentAge = input.currentYear - input.startYear
  const hasPast = input.currentYear > input.startYear

  return (
    <div className="space-y-0">
      {hasPast && (
        <PromptModalButton
          title={`これまでの人生をAIで振り返る（0〜${currentAge - 1}歳）`}
          lead={`0歳から昨年までのダイレクション（重要度${LIFE_PROMPT_MIN_IMPORTANCE}以上）と四柱推命の年運をまとめたプロンプトを作ります。お使いのAI（ChatGPT・Claudeなど）に貼り付けると、これまでの人生の流れと転換期を読み解いてくれます。`}
          modalTitle="これまでの人生のプロンプト"
          prompt={() => buildLifePrompt({ ...input, mode: 'past' })}
        />
      )}
      <PromptModalButton
        title={`これからの人生をAIで読む（${currentAge}〜100歳）`}
        lead={`今年から100歳までのダイレクション（重要度${LIFE_PROMPT_MIN_IMPORTANCE}以上）と四柱推命の年運をまとめたプロンプトを作ります。お使いのAI（ChatGPT・Claudeなど）に貼り付けると、これからの人生の流れと転換期を読み解いてくれます。`}
        modalTitle="これからの人生のプロンプト"
        prompt={() => buildLifePrompt({ ...input, mode: 'future' })}
      />
    </div>
  )
}
