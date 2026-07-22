// 出生ペア/ダイレクション×トランシットの発動パターンが「良い運」か「注意すべき運」かを
// 表す共通の型とスタイル。相性判定（AISHO_TONE_STYLE）と同じ配色（良=エメラルド／注意=ローズ）に揃えている
export type TriggerPolarity = 'lucky' | 'caution'

export const TRIGGER_POLARITY_STYLE: Record<
  TriggerPolarity,
  { icon: string; text: string; border: string; bg: string; ring: string }
> = {
  lucky: {
    icon: '✨',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    bg: 'rgba(16,185,129,0.10)',
    ring: 'ring-emerald-400/50',
  },
  caution: {
    icon: '⚠️',
    text: 'text-rose-300',
    border: 'border-rose-500/40',
    bg: 'rgba(244,63,94,0.10)',
    ring: 'ring-rose-400/50',
  },
}
