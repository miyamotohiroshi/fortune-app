import { calculateZodiacId } from './zodiacCalc'
import { getMonthBranchBySetsuiri, dateToJD, findSolarTermJD } from './solarTerms'

// ─── 基本定数 ────────────────────────────────────────────────────────────────

/** 十干 (0=甲 … 9=癸) */
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const

/** 十二支 (0=子 … 11=亥) */
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

/** 五行 (0=木 … 4=水) */
export const ELEMENTS = ['木', '火', '土', '金', '水'] as const

/** 通変星 (1-10)。0 は日主（空欄）用のダミー */
export const TSUHENSEI = ['', '比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '印綬'] as const

/** 十二運星（長生からの並び順） */
export const JUNI_UN = ['長生', '沐浴', '冠帯', '建禄', '帝旺', '衰', '病', '死', '墓', '絶', '胎', '養'] as const

// 十干の五行インデックス
const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4] // 甲乙丙丁戊己庚辛壬癸
// 十干の陰陽 (1=陽, 0=陰)
const STEM_POLARITY = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
// 十二支の五行インデックス
const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4] // 子丑寅卯辰巳午未申酉戌亥
// 十二支の陰陽 (index の偶奇: 陽=子寅辰午申戌 / 陰=丑卯巳未酉亥)
const BRANCH_POLARITY = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]

// 相克: CONTROLS[i] = 五行 i が克する五行
const CONTROLS = [2, 3, 4, 0, 1] // 木克土, 火克金, 土克水, 金克木, 水克火

/**
 * 蔵干テーブル。各地支に対し [余気, (中気), 本気] の順で十干インデックスを並べる。
 * 本気（性格・通変星の判定に用いる主星）は配列の末尾。
 */
const HIDDEN_STEMS: number[][] = [
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

// 日干ごとの「長生」の地支インデックス
const CHOSEI_BRANCH = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3] // 甲乙丙丁戊己庚辛壬癸

/** 十二運星ごとのパワー（★の数, 1-5） */
const JUNI_UN_POWER: Record<string, number> = {
  帝旺: 5, 建禄: 5, 冠帯: 4, 長生: 4, 沐浴: 3, 養: 3,
  胎: 2, 衰: 2, 病: 2, 死: 1, 墓: 1, 絶: 1,
}

// ─── 計算ヘルパー ────────────────────────────────────────────────────────────

/** 日干インデックスと対象干インデックスから通変星ID(1-10)を返す */
function calcTsuhensei(dayStemIdx: number, targetStemIdx: number): number {
  const dayEl = STEM_ELEMENT[dayStemIdx]
  const dayPol = STEM_POLARITY[dayStemIdx]
  const tgtEl = STEM_ELEMENT[targetStemIdx]
  const tgtPol = STEM_POLARITY[targetStemIdx]
  const same = dayPol === tgtPol

  if (dayEl === tgtEl) return same ? 1 : 2                 // 比肩 / 劫財
  if ((dayEl + 1) % 5 === tgtEl) return same ? 3 : 4       // 食神 / 傷官（日干が生じる）
  if (CONTROLS[dayEl] === tgtEl) return same ? 5 : 6       // 偏財 / 正財（日干が克する）
  if (CONTROLS[tgtEl] === dayEl) return same ? 7 : 8       // 偏官 / 正官（日干が克される）
  if ((tgtEl + 1) % 5 === dayEl) return same ? 9 : 10      // 偏印 / 印綬（日干が生じられる）
  return 1
}

/** 日干と地支から十二運星インデックス(0-11)を返す */
function calcJuniUn(dayStemIdx: number, branchIdx: number): number {
  const chosei = CHOSEI_BRANCH[dayStemIdx]
  const forward = STEM_POLARITY[dayStemIdx] === 1 // 陽干は順行, 陰干は逆行
  return forward
    ? (branchIdx - chosei + 12) % 12
    : (chosei - branchIdx + 12) % 12
}

// ─── 型 ──────────────────────────────────────────────────────────────────────

/** 1柱分の命式データ */
export type Pillar = {
  /** 柱名（年・月・日・時） */
  label: string
  /** 天干インデックス (0-9)。時柱で時刻不明なら null */
  stem: number | null
  /** 地支インデックス (0-11)。時柱で時刻不明なら null */
  branch: number | null
  /** 蔵干インデックス配列 [余気…本気] */
  hidden: number[]
  /** 天干の通変星ID(1-10)。日柱（日主）は null */
  tsuhenStem: number | null
  /** 地支（本気）の通変星ID(1-10) */
  tsuhenBranch: number | null
  /** 十二運星インデックス(0-11) */
  juniUn: number | null
  /** 通根(true) / 無根(false) */
  hasRoot: boolean | null
}

/** 日主（身）の強弱判定 */
export type StrengthAnalysis = {
  /** 身強 / 中庸 / 身弱 */
  label: string
  /** 日主を強める星（比劫・印）の点数 */
  ally: number
  /** 日主を弱める星（食傷・財・官殺）の点数 */
  enemy: number
  /** 日主の五行インデックス */
  dayElement: number
  /** 短い解説 */
  desc: string
}

export type Meishiki = {
  /** 年・月・日・時 の順 */
  pillars: Pillar[]
  /** 時柱が時刻不明で算出できないか */
  hourUnknown: boolean
  /** 五行の個数 [木, 火, 土, 金, 水]（干支8字で集計） */
  elements: number[]
  /** 陰の個数 */
  yin: number
  /** 陽の個数 */
  yang: number
  /** 日主の強弱 */
  strength: StrengthAnalysis
}

// ─── メイン ──────────────────────────────────────────────────────────────────

/**
 * 生年月日（＋出生時刻）から四柱命式を算出する。
 *
 * @param year   西暦（グレゴリオ暦）
 * @param month  月 (1-12)
 * @param day    日 (1-31)
 * @param hour   時 (0-23)。不明なら null（時柱は算出しない）
 */
export function computeMeishiki(
  year: number,
  month: number,
  day: number,
  hour: number | null
): Meishiki {
  // getMonthBranchBySetsuiri / 節入り計算は UTC 基準で日付を解釈するため、
  // 意図した暦日をそのまま UTC で組み立てる（タイムゾーンによるズレを防ぐ）。
  const refDate = new Date(Date.UTC(year, month - 1, day, 12))
  const birthJD = dateToJD(year, month, day, 12)

  // ── 日柱 ── 既存の干支ID(1-60)から日干・日支を導出
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const zodiacId = calculateZodiacId(dateStr)
  const dayStem = (zodiacId - 1) % 10
  const dayBranch = (zodiacId - 1) % 12

  // ── 年柱 ── 立春を年の境界とする
  const risshunJD = findSolarTermJD(year, 315, 2, 4)
  const solarYear = birthJD < risshunJD ? year - 1 : year
  const yearStem = ((solarYear - 4) % 10 + 10) % 10
  const yearBranch = ((solarYear - 4) % 12 + 12) % 12

  // ── 月柱 ── 月支は節入り、月干は五虎遁（年干から導出）
  const monthBranch = getMonthBranchBySetsuiri(refDate)
  const monthStem = ((yearStem % 5) * 2 + 2 + ((monthBranch - 2 + 12) % 12)) % 10

  // ── 時柱 ── 時支は2時間区切り、時干は五鼠遁（日干から導出）
  let hourStem: number | null = null
  let hourBranch: number | null = null
  if (hour !== null) {
    hourBranch = Math.floor((hour + 1) / 2) % 12
    hourStem = ((dayStem % 5) * 2 + hourBranch) % 10
  }

  // 通根判定用: 全地支の蔵干のうち「余気を除いた」五行の集合
  const rootElements = new Set<number>()
  for (const b of [yearBranch, monthBranch, dayBranch, hourBranch]) {
    if (b === null) continue
    HIDDEN_STEMS[b].slice(1).forEach((s) => rootElements.add(STEM_ELEMENT[s]))
  }

  const build = (
    label: string,
    stem: number | null,
    branch: number | null,
    isDayPillar: boolean
  ): Pillar => {
    const hidden = branch !== null ? HIDDEN_STEMS[branch] : []
    const mainHidden = hidden.length ? hidden[hidden.length - 1] : null
    return {
      label,
      stem,
      branch,
      hidden,
      // 日柱の天干は日主そのものなので通変星を持たない（空欄）
      tsuhenStem: stem === null || isDayPillar ? null : calcTsuhensei(dayStem, stem),
      tsuhenBranch: mainHidden === null ? null : calcTsuhensei(dayStem, mainHidden),
      juniUn: branch === null ? null : calcJuniUn(dayStem, branch),
      hasRoot: stem === null ? null : rootElements.has(STEM_ELEMENT[stem]),
    }
  }

  const pillars = [
    build('年', yearStem, yearBranch, false),
    build('月', monthStem, monthBranch, false),
    build('日', dayStem, dayBranch, true),
    build('時', hourStem, hourBranch, false),
  ]

  // ── 五行・陰陽バランス（天干＋地支の8字を各1点で集計） ──
  const elements = [0, 0, 0, 0, 0]
  let yin = 0
  let yang = 0
  for (const p of pillars) {
    if (p.stem !== null) {
      elements[STEM_ELEMENT[p.stem]] += 1
      STEM_POLARITY[p.stem] === 1 ? yang++ : yin++
    }
    if (p.branch !== null) {
      elements[BRANCH_ELEMENT[p.branch]] += 1
      BRANCH_POLARITY[p.branch] === 1 ? yang++ : yin++
    }
  }

  // ── 身強・身弱の判定 ──
  // 味方＝比肩(1)・劫財(2)・偏印(9)・印綬(10)、敵＝食傷・財・官殺
  const ALLY_TSUHEN = new Set([1, 2, 9, 10])
  let ally = 0
  let enemy = 0
  for (const p of pillars) {
    // 天干（日柱は日主そのもの＝味方）
    if (p.stem !== null) {
      if (p.label === '日') ally += 1
      else if (p.tsuhenStem !== null) ALLY_TSUHEN.has(p.tsuhenStem) ? ally++ : enemy++
    }
    // 地支（本気）。月支は月令として重み2
    if (p.tsuhenBranch !== null) {
      const w = p.label === '月' ? 2 : 1
      ALLY_TSUHEN.has(p.tsuhenBranch) ? (ally += w) : (enemy += w)
    }
  }
  const de = STEM_ELEMENT[dayStem]
  let label: string
  let desc: string
  if (ally > enemy) {
    label = '身強'
    desc = `日主（${ELEMENTS[de]}）を強める星が多く、自我とエネルギーが強いタイプ。自立心が高く責任や財も自力で扱える一方、我が強く出やすい面も。`
  } else if (ally < enemy) {
    label = '身弱'
    desc = `日主（${ELEMENTS[de]}）を弱める星が多く、周囲との協調やサポートの中で力を発揮するタイプ。柔軟で気配り上手な一方、環境に影響されやすい面も。`
  } else {
    label = '中庸'
    desc = `日主（${ELEMENTS[de]}）を強める星と弱める星が拮抗したバランス型。状況に応じて強さと柔軟さを使い分けられるタイプ。`
  }

  return {
    pillars,
    hourUnknown: hour === null,
    elements,
    yin,
    yang,
    strength: { label, ally, enemy, dayElement: de, desc },
  }
}

/**
 * DB 保存の birthday(Date) と birthTime(文字列 "HH:MM") から命式を算出する。
 *
 * 生年月日は「日本時間(JST)の暦日」として解釈する。birthday は JST 基準の
 * 深夜0時で保存される（例: 1982-10-07 → 1982-10-06T15:00:00Z）ため、UTC で
 * 日付を読むと前日にズレてしまう。ここで +9h して JST の暦日を復元することで、
 * 保存済みの日柱(zodiacDayId)・元命(genmeiId) と必ず一致させる。
 */
export function computeMeishikiFromBirth(birthday: Date, birthTime: string | null): Meishiki {
  const jst = new Date(birthday.getTime() + 9 * 60 * 60 * 1000)
  const year = jst.getUTCFullYear()
  const month = jst.getUTCMonth() + 1
  const day = jst.getUTCDate()
  const h = birthTime ? parseInt(birthTime.split(':')[0], 10) : null
  return computeMeishiki(year, month, day, Number.isNaN(h as number) ? null : h)
}

// ─── 表示用ヘルパー ──────────────────────────────────────────────────────────

/** 十干の五行インデックス */
export function stemElement(idx: number): number {
  return STEM_ELEMENT[idx]
}
/** 十干の陰陽 (true=陽) */
export function stemIsYang(idx: number): boolean {
  return STEM_POLARITY[idx] === 1
}
/** 十二支の五行インデックス */
export function branchElement(idx: number): number {
  return BRANCH_ELEMENT[idx]
}
/** 十二支の陰陽 (true=陽) */
export function branchIsYang(idx: number): boolean {
  return BRANCH_POLARITY[idx] === 1
}
/** 十二運星のパワー（★の数, 1-5） */
export function juniUnPower(unIdx: number): number {
  return JUNI_UN_POWER[JUNI_UN[unIdx]] ?? 0
}
