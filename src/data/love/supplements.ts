import type { LoveTheme } from './themes'

/**
 * 年柱・月柱による恋愛診断の補足（将来拡張用。現在は未使用で空）。
 *
 *   month … 月柱（元命＝通変星10種などをキー）: 社会や人前での恋愛の振る舞い
 *   year  … 年柱（年支12種・年干の通変星などをキー）: 育った環境や家族観が恋愛に与える影響
 *
 * 基本の鑑定（日柱）と矛盾させないため、補足は「〜な面が加わる」「〜の場面では」といった
 * 上乗せの書き方だけにし、基本の鑑定を否定する文は書かない。
 */
export type LoveSupplement = {
  source: 'month' | 'year'
  /** 例: source='month' なら元命の通変星名（'食神' など） */
  key: string
  theme: LoveTheme
  body: string
  basis: string[]
}

export const LOVE_SUPPLEMENTS: LoveSupplement[] = []
