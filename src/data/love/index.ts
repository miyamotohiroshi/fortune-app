/**
 * 恋愛診断データの取得口。
 * ※ 本文データはサーバーコンポーネントからだけ使うこと（ブラウザのJSに丸ごと含めないため）。
 */
import { STEMS, BRANCHES } from '@/src/lib/meishikiCalc'
import {
  LOVE_GROUPS,
  LOVE_THEMES,
  type LoveGroupId,
  type LovePillarEntry,
  type LoveProfile,
  type LoveReading,
} from './themes'
import KINOE from './readings-kinoe'
import KINOTO from './readings-kinoto'
import HINOE from './readings-hinoe'
import HINOTO from './readings-hinoto'
import TSUCHINOE from './readings-tsuchinoe'
import TSUCHINOTO from './readings-tsuchinoto'
import KANOE from './readings-kanoe'
import KANOTO from './readings-kanoto'
import MIZUNOE from './readings-mizunoe'
import MIZUNOTO from './readings-mizunoto'

/** 日干ごとのデータファイル（甲〜癸の10ファイル × 6干支 ＝ 60干支） */
const ENTRIES: LovePillarEntry[] = [
  ...KINOE, ...KINOTO, ...HINOE, ...HINOTO, ...TSUCHINOE,
  ...TSUCHINOTO, ...KANOE, ...KANOTO, ...MIZUNOE, ...MIZUNOTO,
]

/** 干支ID(1-60) → 干支名 */
export function dayPillarName(dayPillarId: number): string {
  return STEMS[(dayPillarId - 1) % 10] + BRANCHES[(dayPillarId - 1) % 12]
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 全鑑定文（チェック用にも使う） */
export const ALL_LOVE_READINGS: LoveReading[] = ENTRIES.flatMap((e) =>
  LOVE_THEMES.flatMap((t) => {
    const r = e.readings[t.id]
    if (!r) return []
    return [
      {
        id: `love-${pad(e.dayPillarId)}-${t.id}`,
        dayPillarId: e.dayPillarId,
        dayPillar: dayPillarName(e.dayPillarId),
        theme: t.id,
        themeName: t.name,
        title: r.title,
        body: r.body,
        interpretationBasis: r.basis,
        version: e.version,
      },
    ]
  }),
)

export const ALL_LOVE_PROFILES: LoveProfile[] = ENTRIES.map((e) => ({
  dayPillarId: e.dayPillarId,
  dayPillar: dayPillarName(e.dayPillarId),
  typeName: e.typeName,
  summary: e.summary,
}))

export type LoveResult = {
  profile: LoveProfile
  groups: { id: LoveGroupId; label: string; items: LoveReading[] }[]
}

/**
 * 日柱の干支ID(1-60)から恋愛診断を取得する。
 * データが無い干支は null（画面側でセクションごと非表示）。欠けているテーマは飛ばす。
 */
export function getLoveReading(dayPillarId: number): LoveResult | null {
  const profile = ALL_LOVE_PROFILES.find((p) => p.dayPillarId === dayPillarId)
  if (!profile) return null
  const items = ALL_LOVE_READINGS.filter((r) => r.dayPillarId === dayPillarId)
  if (items.length === 0) return null
  const groups = LOVE_GROUPS.map((g) => ({
    ...g,
    items: LOVE_THEMES.filter((t) => t.group === g.id).flatMap(
      (t) => items.find((r) => r.theme === t.id) ?? [],
    ),
  })).filter((g) => g.items.length > 0)
  return { profile, groups }
}
