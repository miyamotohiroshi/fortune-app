import { buildPersonalityPrompt } from '@/src/lib/personality-prompt'
import type { PersonalityPromptInput } from '@/src/lib/personality-prompt'
import { PromptModalButton } from './PromptModalButton'

// 性格タブ（東洋・西洋の両方の一番下）に置く「性格をAIでまとめて読むためのプロンプト」ボタン。
// プロンプトはサーバー側で組み立て（アスペクト解説をDBから読むため）、文字列だけをボタンに渡す
export async function PersonalityPromptSection(props: PersonalityPromptInput) {
  const prompt = await buildPersonalityPrompt(props)

  return (
    <PromptModalButton
      title="東洋と西洋の性格をAIでまとめて読む"
      lead="四柱推命・九星気学・西洋占星術の結果と解説をすべてまとめたプロンプトを作ります。お使いのAI（ChatGPT・Claudeなど）に貼り付けると、東洋と西洋を統合した性格を詳しく文章にしてくれます。"
      modalTitle="性格のプロンプト"
      prompt={prompt}
    />
  )
}
