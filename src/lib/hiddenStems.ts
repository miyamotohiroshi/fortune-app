import { getMonthBranchInfo } from './solarTerms'

/**
 * 蔵干テーブル。各地支に対し [初蔵(余気), (中蔵/中気), 本蔵(本気)] の順で十干インデックスを並べる
 * （十干インデックス: 0=甲 … 9=癸）。本気（末尾）は月支以外の柱（年・日・時）の通変星判定にも使う
 */
export const HIDDEN_STEMS: number[][] = [
  [8, 9],       // 子: 壬・癸        本気=癸
  [9, 7, 5],    // 丑: 癸・辛・己    本気=己
  [4, 2, 0],    // 寅: 戊・丙・甲    本気=甲
  [0, 1],       // 卯: 甲・乙        本気=乙
  [1, 9, 4],    // 辰: 乙・癸・戊    本気=戊
  [4, 6, 2],    // 巳: 戊・庚・丙    本気=丙
  [2, 5, 3],    // 午: 丙・己・丁    本気=丁
  [3, 1, 5],    // 未: 丁・乙・己    本気=己
  [4, 8, 6],    // 申: 戊・壬・庚    本気=庚
  [6, 7],       // 酉: 庚・辛        本気=辛
  [7, 3, 4],    // 戌: 辛・丁・戊    本気=戊
  [4, 0, 8],    // 亥: 戊・甲・壬    本気=壬
]

// 初蔵(余気)が節入り後何日目まで有効か（節入り当日を1日目とする）
const YOKI_END_DAY = [10, 9, 7, 10, 9, 7, 10, 9, 7, 10, 9, 7]
// 中蔵(中気)が節入り後何日目まで有効か（中気を持たない地支＝子・卯・酉はnull）
const CHUKI_END_DAY: (number | null)[] = [null, 12, 14, null, 12, 14, 20, 12, 14, null, 12, 14]

/**
 * 地支インデックスと、その地支に切り替わってからの経過日数（節入り当日=1日目）から、
 * その時点で「発動している」蔵干（十干インデックス）を返す。
 * 月支はこの日数によって初蔵・中蔵・本蔵が切り替わる（月柱の元命判定に使う）
 */
export function getHiddenStemIdx(branchIdx: number, elapsedDays: number): number {
  const hidden = HIDDEN_STEMS[branchIdx]
  if (elapsedDays <= YOKI_END_DAY[branchIdx]) return hidden[0]
  const chukiEnd = CHUKI_END_DAY[branchIdx]
  if (chukiEnd !== null && elapsedDays <= chukiEnd) return hidden[1]
  return hidden[hidden.length - 1]
}

/**
 * Date（UTCで意図した暦日として解釈）から、月柱の元命判定に使う蔵干（十干インデックス）を返す
 */
export function getMonthHiddenStemIdx(date: Date): number {
  const { branchIndex, elapsedDays } = getMonthBranchInfo(date)
  return getHiddenStemIdx(branchIndex, elapsedDays)
}
