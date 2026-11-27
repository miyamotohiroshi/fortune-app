import { findSolarTermJD, jdToCalendar } from './solarTerms'
import {
  type KyuseiNumber,
  getHonmeiStar,
  getGetsumeiStar,
  getKyuseiCalendar,
} from './kyuseiCalc'

/**
 * 九星気学の吉方位・凶方位（年盤・月盤）を求めるモジュール
 *
 * - 年盤: 立春で切り替わる。引っ越し・転職など長く影響するものに使う
 * - 月盤: 毎月の節入りで切り替わる。旅行・お出かけなど短期のものに使う
 *
 * 判定の優先順位: 凶方位 > 最大吉方 > 吉方 > どちらでもない
 */

export type Direction = '北' | '北東' | '東' | '南東' | '南' | '南西' | '西' | '北西'

/** 表示順（北から時計回り） */
export const DIRECTIONS: Direction[] = ['北', '北東', '東', '南東', '南', '南西', '西', '北西']

export type BadReason = '五黄殺' | '暗剣殺' | '本命殺' | '本命的殺' | '歳破' | '月破'

export type DirectionRank = '最大吉方' | '吉方' | '凶方位' | 'ふつう'

export interface DirectionCell {
  direction: Direction
  /** その方位に回っている星 */
  star: KyuseiNumber
  rank: DirectionRank
  /** 凶方位の理由（複数重なることがある） */
  badReasons: BadReason[]
}

export interface DirectionBoard {
  type: '年盤' | '月盤'
  /** 盤の中央の星 */
  center: KyuseiNumber
  /** この盤が有効な期間（日本時間の暦日。終了日を含む） */
  period: { start: string; end: string }
  cells: DirectionCell[]
}

// ─── 盤の作り方 ─────────────────────────────────────────────────────────────
//
// 星は「中央 → 北西 → 西 → 北東 → 南 → 北 → 南西 → 東 → 南東」の順に
// 1つずつ数字を増やして配置する（年盤・月盤は順行）

const FLY_OFFSET: Record<Direction, number> = {
  北西: 1,
  西: 2,
  北東: 3,
  南: 4,
  北: 5,
  南西: 6,
  東: 7,
  南東: 8,
}

const OPPOSITE: Record<Direction, Direction> = {
  北: '南',
  北東: '南西',
  東: '西',
  南東: '北西',
  南: '北',
  南西: '北東',
  西: '東',
  北西: '南東',
}

/** 十二支（0=子 … 11=亥）が属する方位 */
const BRANCH_DIRECTION: Direction[] = [
  '北', '北東', '北東', '東', '南東', '南東', '南', '南西', '南西', '西', '北西', '北西',
]

function starAt(center: KyuseiNumber, dir: Direction): KyuseiNumber {
  return ((((center - 1 + FLY_OFFSET[dir]) % 9) + 9) % 9 + 1) as KyuseiNumber
}

function findStar(center: KyuseiNumber, star: KyuseiNumber): Direction | null {
  return DIRECTIONS.find((d) => starAt(center, d) === star) ?? null
}

// ─── 相性のよい星 ───────────────────────────────────────────────────────────
//
// 五行で自分を生じる星・自分が生じる星・同じ五行の星が吉。五黄土星は常に除く

export const GOOD_STARS: Record<KyuseiNumber, KyuseiNumber[]> = {
  1: [3, 4, 6, 7],
  2: [6, 7, 8, 9],
  3: [1, 4, 9],
  4: [1, 3, 9],
  5: [2, 6, 7, 8, 9],
  6: [1, 2, 7, 8],
  7: [1, 2, 6, 8],
  8: [2, 6, 7, 9],
  9: [2, 3, 4, 8],
}

/** 本命星・月命星の両方と相性がよい星（最大吉方になる星） */
export function getBestStars(honmei: KyuseiNumber, getsumei: KyuseiNumber): KyuseiNumber[] {
  return GOOD_STARS[honmei].filter((s) => s !== getsumei && GOOD_STARS[getsumei].includes(s))
}

// ─── 期間（節入り日）の計算 ─────────────────────────────────────────────────

/** 節入り日時（JD）を日本時間の暦日 YYYY-MM-DD にする */
function jdToJstDate(jd: number, offsetDays = 0): string {
  const { year, month, day } = jdToCalendar(jd + 9 / 24 + offsetDays)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** 立春基準の年 solarYear の、月支 branch の月が始まる節入りの JD */
function monthStartJD(solarYear: number, branch: number): number {
  const offset = (branch - 2 + 12) % 12 // 寅=0 … 丑=11
  const lon = (315 + offset * 30) % 360
  const calYear = offset === 11 ? solarYear + 1 : solarYear
  const approxMonth = offset === 11 ? 1 : offset + 2
  return findSolarTermJD(calYear, lon, approxMonth, 6)
}

// ─── 盤の判定 ───────────────────────────────────────────────────────────────

function buildCells(
  center: KyuseiNumber,
  branch: number,
  haReason: '歳破' | '月破',
  honmei: KyuseiNumber,
  getsumei: KyuseiNumber
): DirectionCell[] {
  const bad = new Map<Direction, BadReason[]>()
  const add = (dir: Direction | null, reason: BadReason) => {
    if (!dir) return
    bad.set(dir, [...(bad.get(dir) ?? []), reason])
  }

  const gohoDir = findStar(center, 5)
  add(gohoDir, '五黄殺')
  add(gohoDir && OPPOSITE[gohoDir], '暗剣殺')
  const honmeiDir = findStar(center, honmei)
  add(honmeiDir, '本命殺')
  add(honmeiDir && OPPOSITE[honmeiDir], '本命的殺')
  add(OPPOSITE[BRANCH_DIRECTION[branch]], haReason)

  const best = getBestStars(honmei, getsumei)
  const good = GOOD_STARS[honmei]

  return DIRECTIONS.map((direction) => {
    const star = starAt(center, direction)
    const badReasons = bad.get(direction) ?? []
    const rank: DirectionRank =
      badReasons.length > 0
        ? '凶方位'
        : best.includes(star)
          ? '最大吉方'
          : good.includes(star)
            ? '吉方'
            : 'ふつう'
    return { direction, star, rank, badReasons }
  })
}

/** 立春基準の年 solarYear の年盤 */
export function getYearBoard(
  solarYear: number,
  honmei: KyuseiNumber,
  getsumei: KyuseiNumber
): DirectionBoard {
  const center = getHonmeiStar(solarYear)
  const yearBranch = (((solarYear - 4) % 12) + 12) % 12
  return {
    type: '年盤',
    center,
    period: {
      start: jdToJstDate(findSolarTermJD(solarYear, 315, 2, 4)),
      end: jdToJstDate(findSolarTermJD(solarYear + 1, 315, 2, 4), -1),
    },
    cells: buildCells(center, yearBranch, '歳破', honmei, getsumei),
  }
}

/** 立春基準の年 solarYear の、月支 monthBranch の月の月盤 */
export function getMonthBoard(
  solarYear: number,
  monthBranch: number,
  honmei: KyuseiNumber,
  getsumei: KyuseiNumber
): DirectionBoard {
  const center = getGetsumeiStar(getHonmeiStar(solarYear), monthBranch)
  const nextBranch = (monthBranch + 1) % 12
  const nextSolarYear = monthBranch === 1 ? solarYear + 1 : solarYear // 丑月の次は翌年の寅月
  return {
    type: '月盤',
    center,
    period: {
      start: jdToJstDate(monthStartJD(solarYear, monthBranch)),
      end: jdToJstDate(monthStartJD(nextSolarYear, nextBranch), -1),
    },
    cells: buildCells(center, monthBranch, '月破', honmei, getsumei),
  }
}

export interface KyuseiDirections {
  year: DirectionBoard
  month: DirectionBoard
  /** 年盤・月盤のどちらでも吉（最大吉方か吉方）になる方位。引っ越しなど大事な決断向き */
  bothGood: Direction[]
}

/**
 * 指定した日（通常は今日）の年盤・月盤の吉方位・凶方位をまとめて返す
 *
 * @param today 基準日 { year, month, day }（日本時間の暦日）
 */
export function computeKyuseiDirections(
  today: { year: number; month: number; day: number },
  honmei: KyuseiNumber,
  getsumei: KyuseiNumber
): KyuseiDirections {
  const { solarYear, monthBranch } = getKyuseiCalendar(today.year, today.month, today.day)
  // 1月〜節分の丑月・子月は、前年（立春基準）の月として扱う
  const year = getYearBoard(solarYear, honmei, getsumei)
  const month = getMonthBoard(solarYear, monthBranch, honmei, getsumei)
  const isGood = (r: DirectionRank) => r === '最大吉方' || r === '吉方'
  const bothGood = DIRECTIONS.filter(
    (_, i) => isGood(year.cells[i].rank) && isGood(month.cells[i].rank)
  )
  return { year, month, bothGood }
}
