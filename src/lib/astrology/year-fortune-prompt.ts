import { PLANET_NAMES_JA, ASPECT_NAMES_JA } from './constants'
import type { PlanetKey } from './constants'
import type { PlanetPositions } from './planets'
import type { TransitBand } from './transit'
import type { PairTriggerWindow } from './pair-aspect-triggers'
import type { DirectionAspectResult } from './directions'
import type { DirectionTriggerWindow } from './direction-aspect-triggers'
import { TRANSIT_MASTER, aspectCategory } from '@/src/data/transit-master'
import { DIRECTION_MASTER_MAP } from '@/src/data/direction-master'
import { PAIR_TRIGGER_PATTERNS } from '@/src/data/pair-aspect-triggers'
import { TRANSIT_OVERLAP_TRIGGER_PATTERNS } from '@/src/data/transit-overlap-triggers'
import { DIRECTION_TRIGGER_PATTERNS } from '@/src/data/direction-trigger-patterns'

// 「運気（今年）」の下に置く「AIで年運を読むためのプロンプト」を組み立てる。
// ユーザーが自分のAI（ChatGPT・Claude等）に貼り付けて使う前提。名前などの個人情報は含めない。

export type YearFortunePromptInput = {
  year: number
  birthdayISO: string // yyyy-mm-dd
  birthTime: string | null
  birthCity: string | null
  hasTime: boolean
  natalPositions: PlanetPositions
  transitBands: TransitBand[]
  transitTriggerWindows: PairTriggerWindow[] // 出生ペア／トランシット重なりの発動期間
  directions: DirectionAspectResult[]
  directionTriggerWindows: DirectionTriggerWindow[]
}

const SIGNS_JA = [
  '牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座',
  '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座',
]

// 出生時刻・出生地がない場合、時刻に左右される点（月・ASC・MC・DESC）が絡むものはすべて除外する
const TIME_DEPENDENT: PlanetKey[] = ['moon', 'asc', 'mc', 'desc']

function signOf(lon: number): string {
  const l = ((lon % 360) + 360) % 360
  const deg = Math.floor(l % 30)
  return `${SIGNS_JA[Math.floor(l / 30)]} ${deg}°`
}

function fmtMD(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${m}/${d}`
}

function aspectJa(type: keyof typeof ASPECT_NAMES_JA): string {
  return ASPECT_NAMES_JA[type]
}

function p(k: string): string {
  return PLANET_NAMES_JA[k as PlanetKey] ?? k
}

export function buildYearFortunePrompt(input: YearFortunePromptInput): string {
  const { year, birthdayISO, birthTime, birthCity, hasTime, natalPositions } = input
  const usable = (...keys: string[]) => hasTime || keys.every(k => !TIME_DEPENDENT.includes(k as PlanetKey))

  const lines: string[] = []
  const push = (...l: string[]) => lines.push(...l)

  // ── 前提・指示 ──
  push(
    `あなたは経験豊富な西洋占星術師です。以下のデータだけを根拠に、${year}年の運勢を詳しく鑑定してください。`,
    '',
    '## 重要な前提',
    '- このチャットより前の会話履歴、あなたが保存しているメモリ、私（ユーザー）について把握している情報や過去のデータは一切参照・加味しないでください。',
    '- 下に示したデータに書かれていないこと（他の占術の結果、推測による私の属性など）は持ち込まないでください。',
    '- データにない事柄を断定しないでください。',
    '',
  )

  // ── 基本情報 ──
  push(
    '## 基本情報',
    `- 生年月日：${birthdayISO.replace(/-/g, '/')}`,
    `- 出生時刻：${hasTime ? birthTime : '不明'}`,
    `- 出生地：${hasTime ? birthCity : '不明'}`,
    `- 鑑定対象：${year}年1月1日〜12月31日`,
  )
  if (!hasTime) {
    push('- 出生時刻・出生地が不明なため、月・ASC・MCが関わる配置はすべて除外しています。これらには触れないでください。')
  }
  push('')

  // ── 出生図 ──
  const natalKeys: PlanetKey[] = [
    'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'asc', 'mc',
  ]
  push('## 出生図（天体のサイン）')
  for (const k of natalKeys) {
    if (!usable(k)) continue
    push(`- ${p(k)}：${signOf(natalPositions[k])}`)
  }
  push('')

  // ── トランシット ──
  const bands = input.transitBands.filter(b => usable(b.natalPoint))
  push(
    `## ${year}年のトランシット（${bands.length}件）`,
    '形式：トランシット天体 → 出生の天体／アスペクト／期間（最接近日）／重要度(1〜10)／テーマ・要約・キーワード',
    '※ 重要度の高いもの・外惑星（冥王星・海王星・天王星・土星）を優先して読んでください。火星は短期の刺激として扱ってください。',
  )
  if (bands.length === 0) push('- （該当なし）')
  for (const b of bands) {
    const m = TRANSIT_MASTER[`${b.transitPlanet}-${b.natalPoint}-${aspectCategory(b.aspect)}`]
    push(
      `- T${p(b.transitPlanet)} → 出生${p(b.natalPoint)}／${aspectJa(b.aspect)}／${fmtMD(b.startDate)}〜${fmtMD(b.endDate)}（最接近 ${fmtMD(b.exactDate)}・オーブ${b.minOrb.toFixed(1)}°）／重要度 ${m?.importance ?? '-'}`,
    )
    if (m) {
      push(`  - テーマ：${m.title}`, `  - 要約：${m.summary}`, `  - キーワード：${m.events.join('、')}`)
    }
  }
  push('')

  // ── トランシットの発動パターン ──
  const transitTriggers = input.transitTriggerWindows.flatMap(tw => {
    const pair = PAIR_TRIGGER_PATTERNS.find(pt => pt.id === tw.patternId)
    if (pair) {
      if (!usable(...pair.planets, pair.triggerPlanet)) return []
      return [{ tw, title: pair.title, description: pair.description, polarity: pair.polarity }]
    }
    const ov = TRANSIT_OVERLAP_TRIGGER_PATTERNS.find(pt => pt.id === tw.patternId)
    if (ov) {
      if (!usable(ov.natalPoint, ov.baseTransitPlanet, ov.overlapTransitPlanet)) return []
      return [{ tw, title: ov.title, description: ov.description, polarity: ov.polarity }]
    }
    return []
  })
  push(
    `## ${year}年の特別な発動期間（トランシットの重なり）`,
    '出生図の配置にトランシットが重なり、意味が強まる期間です。',
  )
  if (transitTriggers.length === 0) push('- （該当なし）')
  for (const t of transitTriggers) {
    push(
      `- 【${t.polarity === 'lucky' ? '好機' : '注意'}】${t.title}／${fmtMD(t.tw.startDate)}〜${fmtMD(t.tw.endDate)}（最接近 ${fmtMD(t.tw.exactDate)}）`,
      `  - 要約：${t.description}`,
    )
  }
  push('')

  // ── ダイレクション ──
  const directions = input.directions
    .filter(d => usable(d.directedPlanet, d.natalPlanet))
    .sort((a, b) => (DIRECTION_MASTER_MAP.get(b.masterKey)?.importance ?? 0) - (DIRECTION_MASTER_MAP.get(a.masterKey)?.importance ?? 0))
  const age = directions[0]?.age ?? year - Number(birthdayISO.slice(0, 4))
  push(
    `## ${year}年のダイレクション（ソーラーアーク／${age}歳の年・${directions.length}件）`,
    '人生の大きな流れを示す長期的な配置です（誕生日前後を中心に1〜2年程度続く影響）。トランシットより根本的なテーマとして扱ってください。',
    '形式：ダイレクション天体 → 出生の天体／アスペクト／オーブ／重要度(1〜10)／カテゴリ／テーマ・要約・キーワード',
  )
  if (directions.length === 0) push('- （該当なし）')
  for (const d of directions) {
    const m = DIRECTION_MASTER_MAP.get(d.masterKey)
    push(
      `- D${p(d.directedPlanet)} → 出生${p(d.natalPlanet)}／${aspectJa(d.aspectType)}／オーブ${d.orb.toFixed(2)}°／重要度 ${m?.importance ?? '-'}／${m?.category ?? '-'}`,
    )
    if (m) {
      push(
        `  - テーマ：${m.title}（${m.mainTheme}・${m.subTheme}）`,
        `  - 要約：${m.summary}`,
        `  - キーワード：${m.tags.map(t => t.label).join('、')}`,
      )
    }
  }
  push('')

  // ── ダイレクションの発動期間 ──
  const directionTriggers = input.directionTriggerWindows.flatMap(tw => {
    const pt = DIRECTION_TRIGGER_PATTERNS.find(x => x.id === tw.patternId)
    if (!pt || !usable(pt.directedPlanet, pt.natalPlanet, pt.triggerPlanet, pt.triggerNatalPoint)) return []
    return [{ tw, pt }]
  })
  push(
    `## ${year}年のダイレクション発動期間`,
    'ダイレクションで動いている配置に、トランシットが重なって具体的な出来事として表れやすい期間です。',
  )
  if (directionTriggers.length === 0) push('- （該当なし）')
  for (const { tw, pt } of directionTriggers) {
    push(
      `- 【${pt.polarity === 'lucky' ? '好機' : '注意'}】${pt.title}／${fmtMD(tw.startDate)}〜${fmtMD(tw.endDate)}（最接近 ${fmtMD(tw.exactDate)}）`,
      `  - 要約：${pt.description}`,
    )
  }
  push('')

  // ── 出力指示 ──
  push(
    '## 出力してほしい内容',
    '以下の構成で、日本語で3000〜4000字程度にまとめてください。',
    `1. ${year}年の総合運：ダイレクションが示す長期テーマと、重要度の高いトランシットを統合した一年の全体像`,
    '2. 時期別の流れ：1〜3月／4〜6月／7〜9月／10〜12月の四半期ごとに、どの配置が効いているかを根拠に解説',
    '3. 分野別の運勢：仕事・キャリア／恋愛・結婚／人間関係／お金／健康',
    '4. 特に注目すべき時期：好機と注意期を日付つきで箇条書き',
    '5. この一年を活かすためのアドバイス',
    '',
    '## 書き方のルール',
    '- 占星術に詳しくない人にも分かる言葉で書き、専門用語を使うときは簡単な説明を添えてください。',
    '- 重要度の数字を目安に、影響の大きい配置ほど詳しく扱ってください。重要度の低い配置は補足程度でかまいません。',
    '- 不安をあおる表現は避け、注意期も「どう過ごせばよいか」とセットで書いてください。',
    '- 複数の配置が同じ時期に重なる場合は、その組み合わせの意味を読み解いてください。',
  )

  return lines.join('\n')
}
