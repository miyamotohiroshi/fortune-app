import { Body, GeoVector, Ecliptic, SunPosition } from 'astronomy-engine'
import type { PlanetKey, AspectType } from './constants'
import type { PlanetPositions } from './planets'

// トランシット対象の外惑星（この配列順が表示の優先順位：冥王星が最上位）
export const TRANSIT_PLANETS = ['pluto', 'neptune', 'uranus', 'saturn', 'jupiter'] as const
export type TransitPlanetKey = (typeof TRANSIT_PLANETS)[number]

// タイムライン表示はしないが、出生ペアアスペクトの発動判定（トリガー天体・除外天体チェック）には
// 内惑星も使うことがあるため加えた型
export type ExtendedTransitPlanetKey = TransitPlanetKey | 'mars' | 'sun' | 'moon' | 'mercury' | 'venus'

// メジャー5アスペクト
export const TRANSIT_ASPECTS: { type: AspectType; angle: number }[] = [
  { type: 'conjunction', angle: 0 },
  { type: 'opposition', angle: 180 },
  { type: 'square', angle: 90 },
  { type: 'trine', angle: 120 },
  { type: 'sextile', angle: 60 },
]

// 出生点の表示順（この順で上から並べる）
export const NATAL_ORDER: PlanetKey[] = [
  'sun', 'moon', 'asc', 'mc', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
]

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function angularDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

// ── オーブ・マトリクス（前後○度以内）──────────────────────────────
const NATAL_GROUP1: PlanetKey[] = ['sun', 'moon', 'asc', 'mc']
const NATAL_GROUP2: PlanetKey[] = ['mercury', 'venus', 'mars']
// GROUP3 = jupiter, saturn, uranus, neptune, pluto（上記以外）

export function getTransitOrb(natal: PlanetKey, transit: ExtendedTransitPlanetKey): number {
  const isJupiter = transit === 'jupiter'
  if (NATAL_GROUP1.includes(natal)) {
    return isJupiter ? 5 : 3 // 木星5° / 土星・天海冥3°
  }
  if (NATAL_GROUP2.includes(natal)) {
    return 2 // すべて2°
  }
  // GROUP3（木星・土星・天王星・海王星・冥王星）
  return isJupiter ? 2 : 1 // 木星2° / 土星・天海冥1°
}

const BODY_MAP: Partial<Record<ExtendedTransitPlanetKey, Body>> = {
  pluto: Body.Pluto,
  neptune: Body.Neptune,
  uranus: Body.Uranus,
  saturn: Body.Saturn,
  jupiter: Body.Jupiter,
  mars: Body.Mars,
  moon: Body.Moon,
  mercury: Body.Mercury,
  venus: Body.Venus,
}

// 太陽のみ出生位置計算（planets.ts）と同じSunPositionを使い、他はGeoVectorで統一
function transitLongitude(planet: ExtendedTransitPlanetKey, date: Date): number {
  if (planet === 'sun') return norm360(SunPosition(date).elon)
  const vec = GeoVector(BODY_MAP[planet]!, date, true)
  return norm360(Ecliptic(vec).elon)
}

export type TransitBand<TP extends ExtendedTransitPlanetKey = TransitPlanetKey> = {
  transitPlanet: TP
  natalPoint: PlanetKey
  aspect: AspectType
  startDate: string // ISO yyyy-mm-dd
  endDate: string
  exactDate: string
  minOrb: number
}

function isoOf(d: Date): string {
  return d.toISOString().split('T')[0]
}

function yearDays(year: number): Date[] {
  const days: Date[] = []
  const start = Date.UTC(year, 0, 1, 12, 0, 0)
  const end = Date.UTC(year, 11, 31, 12, 0, 0)
  for (let t = start; t <= end; t += 24 * 60 * 60 * 1000) {
    days.push(new Date(t))
  }
  return days
}

// 指定年（1/1〜12/31）で、単一トランシット天体×指定の出生点×メジャー5アスペクトの
// オーブ内バンド（連続期間）を算出する。ペアアスペクト発動判定（除外天体チェック）でも再利用する
export function calculateBandsForPlanet<TP extends ExtendedTransitPlanetKey>(
  natalPositions: PlanetPositions,
  transitPlanet: TP,
  natalPoints: PlanetKey[],
  year: number,
): TransitBand<TP>[] {
  const days = yearDays(year)
  const lons = days.map(d => transitLongitude(transitPlanet, d))

  const bands: TransitBand<TP>[] = []

  for (const np of natalPoints) {
    const natalLon = natalPositions[np]
    const orbLimit = getTransitOrb(np, transitPlanet)
    for (const { type, angle } of TRANSIT_ASPECTS) {
      // 各日のorbを算出し、orbLimit以下の連続区間をバンドとして切り出す
      let bandStart = -1
      let bandMinOrb = Infinity
      let bandExactIdx = -1

      const flush = (endIdx: number) => {
        if (bandStart < 0) return
        bands.push({
          transitPlanet,
          natalPoint: np,
          aspect: type,
          startDate: isoOf(days[bandStart]),
          endDate: isoOf(days[endIdx]),
          exactDate: isoOf(days[bandExactIdx]),
          minOrb: bandMinOrb,
        })
        bandStart = -1
        bandMinOrb = Infinity
        bandExactIdx = -1
      }

      for (let i = 0; i < days.length; i++) {
        const diff = angularDiff(lons[i], natalLon)
        const orb = Math.abs(diff - angle)
        if (orb <= orbLimit) {
          if (bandStart < 0) bandStart = i
          if (orb < bandMinOrb) {
            bandMinOrb = orb
            bandExactIdx = i
          }
        } else if (bandStart >= 0) {
          flush(i - 1)
        }
      }
      flush(days.length - 1)
    }
  }

  return bands
}

// 指定年（1/1〜12/31）で、出生点×トランシット外惑星×メジャー5アスペクトの
// オーブ内バンド（連続期間）を算出する
export function calculateTransitBands(
  natalPositions: PlanetPositions,
  year: number,
  hasTime: boolean,
): TransitBand[] {
  // 対象の出生点（時刻がなければ ASC/MC を除外）
  const natalPoints = NATAL_ORDER.filter(k => hasTime || (k !== 'asc' && k !== 'mc'))

  const bands: TransitBand[] = []
  for (const tp of TRANSIT_PLANETS) {
    bands.push(...calculateBandsForPlanet(natalPositions, tp, natalPoints, year))
  }

  // 並び順: トランシット天体（配列順）→ 出生点（NATAL_ORDER）→ アスペクト（TRANSIT_ASPECTS順）→ 開始日
  const transitRank = (k: TransitPlanetKey) => TRANSIT_PLANETS.indexOf(k)
  const natalRank = (k: PlanetKey) => NATAL_ORDER.indexOf(k)
  const aspectRank = (k: AspectType) => TRANSIT_ASPECTS.findIndex(a => a.type === k)

  bands.sort((a, b) => {
    if (a.transitPlanet !== b.transitPlanet) return transitRank(a.transitPlanet) - transitRank(b.transitPlanet)
    if (a.natalPoint !== b.natalPoint) return natalRank(a.natalPoint) - natalRank(b.natalPoint)
    if (a.aspect !== b.aspect) return aspectRank(a.aspect) - aspectRank(b.aspect)
    return a.startDate.localeCompare(b.startDate)
  })

  return bands
}
