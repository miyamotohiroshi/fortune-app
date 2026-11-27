import { getMonthBranchBySetsuiri, dateToJD, findSolarTermJD } from './solarTerms'

/**
 * 九星気学の本命星・月命星を求めるモジュール
 *
 * - 本命星: 生まれ年の九星。年の境界は立春（節分の翌日）
 * - 月命星: 生まれ月の九星。月の境界は各月の節入り
 *
 * 星番号は 1=一白水星 … 9=九紫火星
 */

export type KyuseiNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export const KYUSEI_NAMES: Record<KyuseiNumber, string> = {
  1: '一白水星',
  2: '二黒土星',
  3: '三碧木星',
  4: '四緑木星',
  5: '五黄土星',
  6: '六白金星',
  7: '七赤金星',
  8: '八白土星',
  9: '九紫火星',
}

export interface KyuseiResult {
  /** 本命星（外側・大人になってからの自分） */
  honmei: KyuseiNumber
  /** 月命星（内側・素の自分） */
  getsumei: KyuseiNumber
  /** 立春基準で数えた年（1月〜立春前の生まれは前年） */
  solarYear: number
  /** 節入り基準の月支インデックス (0=子 … 11=亥) */
  monthBranch: number
}

/** 立春基準の年から本命星を求める（九星は年ごとに 9→1 と逆行する） */
export function getHonmeiStar(solarYear: number): KyuseiNumber {
  const n = (((11 - (solarYear % 9)) % 9) + 9) % 9
  return (n === 0 ? 9 : n) as KyuseiNumber
}

/**
 * 本命星と月支から月命星を求める。
 * 寅月（2月節）の星は 一白・四緑・七赤年=八白、二黒・五黄・八白年=二黒、
 * 三碧・六白・九紫年=五黄 で、以降1か月ごとに1つずつ逆行する。
 */
export function getGetsumeiStar(honmei: KyuseiNumber, monthBranch: number): KyuseiNumber {
  const torafuStart = honmei % 3 === 1 ? 8 : honmei % 3 === 2 ? 2 : 5
  const offset = (monthBranch - 2 + 12) % 12 // 寅月=0
  const n = (((torafuStart - 1 - offset) % 9) + 9) % 9 + 1
  return n as KyuseiNumber
}

/** Date を日本時間の暦日 { year, month(1-12), day } にする（サーバーのタイムゾーンに依存しない） */
export function toJstYmd(date: Date): { year: number; month: number; day: number } {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return { year: jst.getUTCFullYear(), month: jst.getUTCMonth() + 1, day: jst.getUTCDate() }
}

/**
 * 暦日を、九星気学の「年（立春基準）」と「月支（節入り基準）」に変換する
 */
export function getKyuseiCalendar(
  year: number,
  month: number,
  day: number
): { solarYear: number; monthBranch: number } {
  // meishikiCalc と同じく、暦日をそのまま UTC 正午で組み立てて節入りと比較する
  const refDate = new Date(Date.UTC(year, month - 1, day, 12))
  const jd = dateToJD(year, month, day, 12)

  const risshunJD = findSolarTermJD(year, 315, 2, 4)
  const solarYear = jd < risshunJD ? year - 1 : year
  const monthBranch = getMonthBranchBySetsuiri(refDate)
  return { solarYear, monthBranch }
}

/**
 * 生年月日から本命星・月命星を求める
 *
 * @param year  西暦
 * @param month 月 (1-12)
 * @param day   日 (1-31)
 */
export function computeKyusei(year: number, month: number, day: number): KyuseiResult {
  const { solarYear, monthBranch } = getKyuseiCalendar(year, month, day)

  const honmei = getHonmeiStar(solarYear)
  const getsumei = getGetsumeiStar(honmei, monthBranch)

  return { honmei, getsumei, solarYear, monthBranch }
}
