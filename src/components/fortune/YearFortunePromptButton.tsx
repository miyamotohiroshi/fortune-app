'use client'

import { buildYearFortunePrompt } from '@/src/lib/astrology/year-fortune-prompt'
import type { YearFortunePromptInput } from '@/src/lib/astrology/year-fortune-prompt'
import { PromptModalButton } from './PromptModalButton'

type Props = {
  input: YearFortunePromptInput
}

// 運気タブの一番下に置く「AIで年運を読むためのプロンプト」ボタン（プロンプトは開いたときに組み立てる）
export function YearFortunePromptButton({ input }: Props) {
  return (
    <PromptModalButton
      title={`${input.year}年の運勢をAIで詳しく読む`}
      lead="この年のトランシット・ダイレクション（西洋）と、四柱推命の年運・相性・天徳（東洋）の情報をまとめたプロンプトを作ります。お使いのAI（ChatGPT・Claudeなど）に貼り付けると、年間の運勢を詳しく文章にしてくれます。"
      modalTitle={`${input.year}年の運勢プロンプト`}
      prompt={() => buildYearFortunePrompt(input)}
    />
  )
}
