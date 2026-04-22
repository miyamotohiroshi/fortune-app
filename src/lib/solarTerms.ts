/**
 * 節入り日時を天文計算で求めるモジュール
 * Jean Meeus "Astronomical Algorithms" (2nd ed.) の太陽黄経計算を使用
 */

// ─── ユーティリティ ───────────────────────────────────────────────────────────

function rad(deg: number): number {
  return (deg * Math.PI) / 180
}

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360
}

// ─── ユリウス日 (JD) 変換 ────────────────────────────────────────────────────

export function dateToJD(
  year: number,
  month: number,
  day: number,
  hour = 0
): number {
  if (month <= 2) {
    year -= 1
    month += 12
  }
  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    hour / 24 +
    B -
    1524.5
  )
}

export function jdToCalendar(jd: number): {
  year: number
  month: number
  day: number
  hour: number
} {
  const jd1 = jd + 0.5
  const Z = Math.floor(jd1)
  const F = jd1 - Z
  let A: number
  if (Z < 2299161) {
    A = Z
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25)
    A = Z + 1 + alpha - Math.floor(alpha / 4)
  }
  const B = A + 1524
  const C = Math.floor((B - 122.1) / 365.25)
  const D = Math.floor(365.25 * C)
  const E = Math.floor((B - D) / 30.6001)
  const day = B - D - Math.floor(30.6001 * E)
  const month = E < 14 ? E - 1 : E - 13
  const year = month > 2 ? C - 4716 : C - 4715
  const hour = F * 24
  return { year, month, day, hour }
}

// ─── 太陽黄経計算 (Jean Meeus) ───────────────────────────────────────────────

export function sunEclipticLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525
  const L0 = normalizeDeg(280.46646 + 36000.76983 * T + 0.0003032 * T * T)
  const M = normalizeDeg(357.52911 + 35999.05029 * T - 0.0001537 * T * T)
  const Mrad = rad(M)
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad)
  const sunLon = normalizeDeg(L0 + C)
  const omega = normalizeDeg(125.04 - 1934.136 * T)
  return normalizeDeg(sunLon - 0.00569 - 0.00478 * Math.sin(rad(omega)))
}

// ─── 節入り日時の計算 ────────────────────────────────────────────────────────

export function findSolarTermJD(
  year: number,
  targetLon: number,
  approxMonth: number,
  approxDay: number
): number {
  let jd = dateToJD(year, approxMonth, approxDay, 12)

  for (let i = 0; i < 50; i++) {
    const lon = sunEclipticLongitude(jd)
    let diff = targetLon - lon
    if (diff > 180)  diff -= 360
    if (diff < -180) diff += 360
    jd += diff  // 太陽は約1°/日進む
    if (Math.abs(diff) < 1e-6) break
  }

  return jd
}

// ─── 12 月節の定義 ───────────────────────────────────────────────────────────
//
//   節    黄経   近似月日   月支インデックス
//   大雪   255   12/07      子(0)
//   小寒   285   01/06      丑(1)
//   立春   315   02/04      寅(2)
//   驚蟄   345   03/06      卯(3)
//   清明    15   04/05      辰(4)
//   立夏    45   05/06      巳(5)
//   芒種    75   06/06      午(6)
//   小暑   105   07/07      未(7)
//   立秋   135   08/07      申(8)
//   白露   165   09/08      酉(9)
//   寒露   195   10/08      戌(10)
//   立冬   225   11/07      亥(11)

interface SolarTerm {
  lon: number
  approxMonth: number
  approxDay: number
  branchIndex: number
}

const SOLAR_TERMS: SolarTerm[] = [
  { lon: 255, approxMonth: 12, approxDay:  7, branchIndex:  0 }, // 大雪 → 子
  { lon: 285, approxMonth:  1, approxDay:  6, branchIndex:  1 }, // 小寒 → 丑
  { lon: 315, approxMonth:  2, approxDay:  4, branchIndex:  2 }, // 立春 → 寅
  { lon: 345, approxMonth:  3, approxDay:  6, branchIndex:  3 }, // 驚蟄 → 卯
  { lon:  15, approxMonth:  4, approxDay:  5, branchIndex:  4 }, // 清明 → 辰
  { lon:  45, approxMonth:  5, approxDay:  6, branchIndex:  5 }, // 立夏 → 巳
  { lon:  75, approxMonth:  6, approxDay:  6, branchIndex:  6 }, // 芒種 → 午
  { lon: 105, approxMonth:  7, approxDay:  7, branchIndex:  7 }, // 小暑 → 未
  { lon: 135, approxMonth:  8, approxDay:  7, branchIndex:  8 }, // 立秋 → 申
  { lon: 165, approxMonth:  9, approxDay:  8, branchIndex:  9 }, // 白露 → 酉
  { lon: 195, approxMonth: 10, approxDay:  8, branchIndex: 10 }, // 寒露 → 戌
  { lon: 225, approxMonth: 11, approxDay:  7, branchIndex: 11 }, // 立冬 → 亥
]

// ─── キャッシュ ──────────────────────────────────────────────────────────────

// 年ごとに { jd, branchIndex }[] を JD 昇順で保持
const cache = new Map<number, { jd: number; branchIndex: number }[]>()

function buildYearTerms(year: number): { jd: number; branchIndex: number }[] {
  const terms: { jd: number; branchIndex: number }[] = []

  for (const t of SOLAR_TERMS) {
    // 大雪(approxMonth=12)は前年と当年の両方を計算する
    if (t.approxMonth === 12) {
      // 前年の大雪（例: 1989-12-07）→ year の年初〜大雪前の子月境界
      terms.push({
        jd: findSolarTermJD(year - 1, t.lon, t.approxMonth, t.approxDay),
        branchIndex: t.branchIndex,
      })
      // 当年の大雪（例: 1990-12-07）→ year の12月大雪以降の子月境界
      terms.push({
        jd: findSolarTermJD(year, t.lon, t.approxMonth, t.approxDay),
        branchIndex: t.branchIndex,
      })
    } else {
      terms.push({
        jd: findSolarTermJD(year, t.lon, t.approxMonth, t.approxDay),
        branchIndex: t.branchIndex,
      })
    }
  }

  // JD 昇順に並べる
  terms.sort((a, b) => a.jd - b.jd)
  cache.set(year, terms)
  return terms
}

// ─── 公開関数 ────────────────────────────────────────────────────────────────

/**
 * Date から月支インデックス (0=子 … 11=亥) を返す
 */
export function getMonthBranchBySetsuiri(date: Date): number {
  const year  = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day   = date.getUTCDate()
  const hour  = date.getUTCHours() + date.getUTCMinutes() / 60

  const birthJD = dateToJD(year, month, day, hour)

  const terms = cache.get(year) ?? buildYearTerms(year)

  // birthJD 以下の最後の節入りを探す（降順スキャン）
  for (let i = terms.length - 1; i >= 0; i--) {
    if (terms[i].jd <= birthJD) {
      return terms[i].branchIndex
    }
  }

  // 当年の最初の節入りより前（= 前年末の亥月）→ 前年キャッシュで再検索
  const prevTerms = cache.get(year - 1) ?? buildYearTerms(year - 1)
  for (let i = prevTerms.length - 1; i >= 0; i--) {
    if (prevTerms[i].jd <= birthJD) {
      return prevTerms[i].branchIndex
    }
  }

  return 11 // 亥月（フォールバック）
}
