export const PLANET_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'asc', 'mc', 'desc',
] as const

export type PlanetKey = (typeof PLANET_KEYS)[number]

export const PLANET_NAMES_JA: Record<PlanetKey, string> = {
  sun: '太陽', moon: '月', mercury: '水星', venus: '金星', mars: '火星',
  jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星',
  pluto: '冥王星', asc: 'ASC', mc: 'MC', desc: 'DESC',
}

export const ASPECT_ANGLES = {
  conjunction:    0,
  opposition:   180,
  square:        90,
  sextile:       60,
  trine:        120,
  semisquare:    45,
  sesquiquadrate: 135,
} as const

export type AspectType = keyof typeof ASPECT_ANGLES

export const ASPECT_NAMES_JA: Record<AspectType, string> = {
  conjunction:    'コンジャンクション（合） 0°',
  opposition:     'オポジション（衝） 180°',
  square:         'スクエア（矩） 90°',
  sextile:        'セクスタイル（六分） 60°',
  trine:          'トライン（三分） 120°',
  semisquare:     'セミスクエア 45°',
  sesquiquadrate: 'セスキクァドレート 135°',
}

export const ASPECT_SYMBOLS: Record<AspectType, string> = {
  conjunction:    '☌',
  opposition:     '☍',
  square:         '□',
  sextile:        '⚹',
  trine:          '△',
  semisquare:     '∠',
  sesquiquadrate: '⊼',
}

// オーブの基準（天体の重要度）
export const PLANET_ORB_WEIGHT: Record<PlanetKey, number> = {
  asc: 10, mc: 10, desc: 10,
  sun: 6, moon: 6,
  mercury: 5, venus: 5, mars: 5, jupiter: 5, saturn: 5,
  uranus: 4, neptune: 4, pluto: 4,
}
