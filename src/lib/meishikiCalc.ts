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

// ─── 流年（年運）計算 ────────────────────────────────────────────────────────

/**
 * 日柱の旬空（空亡）にあたる2つの地支インデックスを返す。
 * その年の年支がこの2支のいずれかなら「天中殺（空亡）」の年。
 */
export function kubouBranches(dayStemIdx: number, dayBranchIdx: number): [number, number] {
  const b1 = (10 - dayStemIdx + dayBranchIdx + 12) % 12
  return [b1, (b1 + 1) % 12]
}

/** ある年の年運（流年） */
export type YearFortune = {
  year: number
  /** 年干インデックス */
  stem: number
  /** 年支インデックス */
  branch: number
  /** 年運星（日干×年干の通変星 1-10） */
  tsuhen: number
  /** 十二運星インデックス(0-11)（日干×年支） */
  juniUn: number
  /** 天中殺（空亡）の年か */
  isKubou: boolean
  /** 天剋地冲（天戦地冲）の年か。日柱×その年の干支で判定 */
  isTenkokuChichu: boolean
  /** 天徳貴人・天徳合の判定結果 */
  tentoku: TentokuResult
}

/**
 * 日柱（日干・日支）・月支と西暦から、その年の年運を算出する。
 * 年干支は立春を境界とする太陽年（暦年＝太陽年として (year-4) で導出）。
 */
export function computeYearFortune(
  dayStemIdx: number,
  dayBranchIdx: number,
  year: number,
  monthBranchIdx: number
): YearFortune {
  const stem = ((year - 4) % 10 + 10) % 10
  const branch = ((year - 4) % 12 + 12) % 12
  const [k1, k2] = kubouBranches(dayStemIdx, dayBranchIdx)
  return {
    year,
    stem,
    branch,
    tsuhen: calcTsuhensei(dayStemIdx, stem),
    juniUn: calcJuniUn(dayStemIdx, branch),
    isKubou: branch === k1 || branch === k2,
    isTenkokuChichu: isStemClash(dayStemIdx, stem) && branchRelations(dayBranchIdx, branch).includes('冲'),
    tentoku: checkTentoku(monthBranchIdx, stem, branch),
  }
}

// ─── 地支の相性（支合・三合・冲・刑・害・破） ───────────────────────────────

export type BranchRelation = '支合' | '三合' | '冲' | '刑' | '害' | '破'

// 六合（支合）
const ROKUGOU: [number, number][] = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]]
// 三合の局（申子辰・亥卯未・寅午戌・巳酉丑）
const SANGOU_GROUPS: number[][] = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]]
// 七冲
const CHU: [number, number][] = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]]
// 三刑の組（寅巳申・丑戌未）、子卯の刑、自刑（辰・午・酉・亥）
const KEI_GROUPS: number[][] = [[2, 5, 8], [1, 10, 7]]
const KEI_PAIR: [number, number][] = [[0, 3]]
const KEI_SELF = [4, 6, 9, 11]
// 六害
const GAI: [number, number][] = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]]
// 六破
const HA: [number, number][] = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]]

function hasPair(pairs: [number, number][], a: number, b: number): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

/**
 * 2つの地支の相性（支合・三合・冲・刑・害・破）を返す。
 * 1組で複数の関係を持つことがある（例: 巳申＝支合・刑・破）。
 * 並びは 支合→三合（吉）→冲→刑→害→破（凶）の順。
 */
export function branchRelations(b1: number, b2: number): BranchRelation[] {
  const r: BranchRelation[] = []
  if (hasPair(ROKUGOU, b1, b2)) r.push('支合')
  if (b1 !== b2 && SANGOU_GROUPS.some((g) => g.includes(b1) && g.includes(b2))) r.push('三合')
  if (hasPair(CHU, b1, b2)) r.push('冲')
  const kei =
    (b1 !== b2 && KEI_GROUPS.some((g) => g.includes(b1) && g.includes(b2))) ||
    hasPair(KEI_PAIR, b1, b2) ||
    (b1 === b2 && KEI_SELF.includes(b1))
  if (kei) r.push('刑')
  if (hasPair(GAI, b1, b2)) r.push('害')
  if (hasPair(HA, b1, b2)) r.push('破')
  return r
}

// ─── 天剋地冲・天徳貴人／天徳合 ────────────────────────────────────────────────

/**
 * 十干同士が「天剋」の関係（陰陽が同じ・かつ五行相剋）かどうか。
 * 例: 甲(陽木)と庚(陽金)は陰陽が同じで金剋木の関係にあるため天剋。
 */
function isStemClash(a: number, b: number): boolean {
  if (STEM_POLARITY[a] !== STEM_POLARITY[b]) return false
  const ea = STEM_ELEMENT[a]
  const eb = STEM_ELEMENT[b]
  return ea !== eb && (CONTROLS[ea] === eb || CONTROLS[eb] === ea)
}

// 天干五合（甲己・乙庚・丙辛・丁壬・戊癸）の相手
function stemGouPartner(idx: number): number {
  return (idx + 5) % 10
}

/** 十干同士が干合（甲己・乙庚・丙辛・丁壬・戊癸）の関係かどうか */
export function isStemGou(a: number, b: number): boolean {
  return stemGouPartner(a) === b
}

export type StemCompatTier = 'best' | 'good' | 'normal' | 'bad'

/**
 * 日干同士の相性を4段階で判定する（十干相性表・相性相関図に基づく）。
 * - best（最高）: 干合（甲己・乙庚・丙辛・丁壬・戊癸）
 * - good（よい）: 相生（生我＝偏印・印綬、我生＝食神・傷官）
 * - normal（普通）: 比和（比肩・劫財、同じ五行）
 * - bad（合わない）: 相剋（偏財・偏官・非干合の正財/正官）※干合の相手は上記bestが優先
 */
export function stemCompatTier(a: number, b: number): StemCompatTier {
  if (isStemGou(a, b)) return 'best'
  const ea = STEM_ELEMENT[a]
  const eb = STEM_ELEMENT[b]
  if (ea === eb) return 'normal'
  if (CONTROLS[ea] === eb || CONTROLS[eb] === ea) return 'bad'
  return 'good'
}

// 六合（支合）の相手
function branchRokugouPartner(idx: number): number {
  const pair = ROKUGOU.find(([a, b]) => a === idx || b === idx)!
  return pair[0] === idx ? pair[1] : pair[0]
}

type TentokuValue = { type: 'stem' | 'branch'; value: number }

// 月支ごとの天徳貴人（子月→巳・丑月→庚・寅月→丁・卯月→申・辰月→壬・巳月→辛・
// 午月→亥・未月→甲・申月→癸・酉月→寅・戌月→丙・亥月→乙）
const TENTOKU_TABLE: TentokuValue[] = [
  { type: 'branch', value: 5 },  // 子 → 巳
  { type: 'stem', value: 6 },    // 丑 → 庚
  { type: 'stem', value: 3 },    // 寅 → 丁
  { type: 'branch', value: 8 },  // 卯 → 申
  { type: 'stem', value: 8 },    // 辰 → 壬
  { type: 'stem', value: 7 },    // 巳 → 辛
  { type: 'branch', value: 11 }, // 午 → 亥
  { type: 'stem', value: 0 },    // 未 → 甲
  { type: 'stem', value: 9 },    // 申 → 癸
  { type: 'branch', value: 2 },  // 酉 → 寅
  { type: 'stem', value: 2 },    // 戌 → 丙
  { type: 'stem', value: 1 },    // 亥 → 乙
]

function tentokuGouOf(v: TentokuValue): TentokuValue {
  return v.type === 'stem'
    ? { type: 'stem', value: stemGouPartner(v.value) }
    : { type: 'branch', value: branchRokugouPartner(v.value) }
}

export type TentokuResult = {
  kijin: TentokuValue
  gou: TentokuValue
  /** その年の干支が天徳貴人と一致するか */
  hasKijin: boolean
  /** その年の干支が天徳合と一致するか */
  hasGou: boolean
}

/**
 * 月支・その年の年干支から、天徳貴人・天徳合の判定を行う。
 * 天徳貴人は月支ごとに決まる十干または十二支、天徳合はその干合・支合の相手。
 */
export function checkTentoku(monthBranchIdx: number, yearStemIdx: number, yearBranchIdx: number): TentokuResult {
  const kijin = TENTOKU_TABLE[monthBranchIdx]
  const gou = tentokuGouOf(kijin)
  const matches = (v: TentokuValue) => (v.type === 'stem' ? v.value === yearStemIdx : v.value === yearBranchIdx)
  return { kijin, gou, hasKijin: matches(kijin), hasGou: matches(gou) }
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
