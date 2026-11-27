// 性格タブの「東洋（四柱推命・九星気学）と西洋（西洋占星術）をまとめてAIで読むためのプロンプト」を組み立てる。
// アスペクト解説をDBから読むため、サーバー側だけで使うこと。
// 名前は含めない。解釈文は画面に出しているものを全文入れる。
import { prisma } from '@/src/lib/prisma'
import {
  STEMS, BRANCHES, ELEMENTS, TSUHENSEI, JUNI_UN,
  stemElement, stemIsYang, branchElement, branchIsYang, juniUnPower,
  type Meishiki,
} from '@/src/lib/meishikiCalc'
import { computeKyusei } from '@/src/lib/kyuseiCalc'
import { KYUSEI_STARS, KYUSEI_OUTER, KYUSEI_INNER, KYUSEI_COMBO } from '@/src/data/kyusei-master'
import { getLoveReading } from '@/src/data/love'
import { GOGYO_DEFICIENCY } from '@/src/data/gogyo-deficiency'
import { JUNIUN_MASTER, JUNIUN_PILLAR_THEME } from '@/src/data/juniun-master'
import { calculatePlanetPositions } from '@/src/lib/astrology/planets'
import { detectPairAspects, detectTripleAspects, pairComboKey, tripleComboKey } from '@/src/lib/astrology/aspects'
import { calculateHouseCusps, assignPlanetsToHouses } from '@/src/lib/astrology/houses'
import { PLANET_NAMES_JA, ASPECT_NAMES_JA, HARD_ASPECT_TYPES } from '@/src/lib/astrology/constants'
import type { PlanetKey } from '@/src/lib/astrology/constants'
import { CITY_COORDS } from '@/src/lib/astrology/cities'
import { HOUSE_PLANET_MASTER } from '@/src/data/house-planet-master'
import { LUCKY_PAIR_KEYS, LUCKY_TRIPLE_KEYS, LUCKY_ASPECT_NOTES } from '@/src/data/lucky-aspects'

type TextItem = { id: number; name: string; title: string; description: string[] }

export type PersonalityPromptInput = {
  /** 生年月日（日本時間の暦日。九星気学・表示用） */
  birth: { year: number; month: number; day: number }
  /** 西洋占星術の計算用（画面と同じ値を渡す） */
  birthday: Date
  birthTime: string | null
  birthCity: string | null
  zodiac: TextItem
  genmei: TextItem | null
  meishiki: Meishiki | null
}

const SIGNS_JA = [
  '牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座',
  '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座',
]

// ASC・MC・DESC（感受点）
const ANGLE_POINTS: PlanetKey[] = ['asc', 'desc', 'mc']
// 出生時刻・出生地がないと正確に出せない点（月は1日で約13°動くため含める）
const TIME_DEPENDENT: PlanetKey[] = ['moon', ...ANGLE_POINTS]

function signOf(lon: number): string {
  const l = ((lon % 360) + 360) % 360
  const inSign = l % 30
  const deg = Math.floor(inSign)
  const min = Math.floor((inSign - deg) * 60)
  return `${SIGNS_JA[Math.floor(l / 30)]} ${deg}°${String(min).padStart(2, '0')}'`
}

const p = (k: PlanetKey) => PLANET_NAMES_JA[k]

export async function buildPersonalityPrompt(input: PersonalityPromptInput): Promise<string> {
  const { birth, birthday, birthTime, birthCity, zodiac, genmei, meishiki } = input
  const cityCoords = birthCity ? (CITY_COORDS[birthCity] ?? null) : null
  const hasTime = !!birthTime && !!cityCoords
  const usable = (...keys: PlanetKey[]) => hasTime || keys.every(k => !TIME_DEPENDENT.includes(k))

  const lines: string[] = []
  const push = (...l: string[]) => lines.push(...l)

  // ── 前提・指示 ──
  push(
    'あなたは東洋占術（四柱推命・九星気学）と西洋占星術の両方に精通した鑑定師です。以下のデータだけを根拠に、私の性格を詳しく鑑定してください。',
    '',
    '## 重要な前提',
    '- このチャットより前の会話履歴、あなたが保存しているメモリ、私（ユーザー）について把握している情報や過去のデータは一切参照・加味しないでください。',
    '- 下に示したデータに書かれていないこと（推測による私の属性、年齢や職業の決めつけなど）は持ち込まないでください。',
    '- データにない事柄を断定しないでください。',
    '',
    '## 基本情報',
    `- 生年月日：${birth.year}/${String(birth.month).padStart(2, '0')}/${String(birth.day).padStart(2, '0')}`,
    `- 出生時刻：${birthTime ?? '不明'}`,
    `- 出生地：${birthCity ?? '不明'}`,
  )
  if (!hasTime) {
    push('- 出生時刻・出生地が不明なため、西洋占星術では月・ASC・MC・ハウスが関わる配置をすべて除外しています。これらには触れないでください。')
  }
  if (meishiki?.hourUnknown) {
    push('- 出生時刻が不明なため、四柱推命の時柱は算出していません。時柱には触れないでください。')
  }
  push('')

  // ════════════════ 東洋 ════════════════
  push('# 東洋占術', '')

  // 日柱
  push(
    '## 四柱推命｜日柱（生まれ持った性格・素の本質）',
    `- 日柱：${zodiac.name}（${zodiac.title}）`,
    ...zodiac.description.map(d => `  - ${d}`),
    '',
  )

  // 元命
  if (genmei) {
    push(
      '## 四柱推命｜元命の通変星（芯にある性格・あなたらしさの軸）',
      `- 元命：${genmei.name}（${genmei.title}）`,
      ...genmei.description.map(d => `  - ${d}`),
      '',
    )
  }

  // 恋愛傾向
  const love = getLoveReading(zodiac.id)
  if (love) {
    push(
      '## 四柱推命｜日柱から見た恋愛傾向',
      `- 恋愛タイプ：${love.profile.typeName}`,
      `- 概要：${love.profile.summary}`,
    )
    for (const g of love.groups) {
      push(`### ${g.label}`)
      for (const r of g.items) {
        push(`- ${r.themeName}：${r.title}`, ...r.body.split('\n').filter(Boolean).map(b => `  ${b}`))
      }
    }
    push('')
  }

  // 命式
  if (meishiki) {
    push('## 四柱推命｜命式')
    for (const pl of meishiki.pillars) {
      if (pl.stem === null || pl.branch === null) continue
      const mainHidden = pl.hidden.length ? STEMS[pl.hidden[pl.hidden.length - 1]] : '—'
      const tsuhenStem = pl.tsuhenStem ? TSUHENSEI[pl.tsuhenStem] : pl.label === '日' ? '日主' : '—'
      const tsuhenBranch = pl.tsuhenBranch ? TSUHENSEI[pl.tsuhenBranch] : '—'
      const juniun = pl.juniUn === null ? null : JUNI_UN[pl.juniUn]
      push(
        `- ${pl.label}柱：${STEMS[pl.stem]}${BRANCHES[pl.branch]}` +
          `／天干 ${STEMS[pl.stem]}（${ELEMENTS[stemElement(pl.stem)]}・${stemIsYang(pl.stem) ? '陽' : '陰'}・${pl.hasRoot ? '通根' : '無根'}）` +
          `／地支 ${BRANCHES[pl.branch]}（${ELEMENTS[branchElement(pl.branch)]}・${branchIsYang(pl.branch) ? '陽' : '陰'}）` +
          `／蔵干 ${mainHidden}（${pl.hidden.map(s => STEMS[s]).join('')}）` +
          `／通変星 天干:${tsuhenStem}・地支:${tsuhenBranch}` +
          (juniun && pl.juniUn !== null ? `／十二運 ${juniun}（パワー${juniUnPower(pl.juniUn)}/5）` : ''),
      )
      const juniunText = juniun ? JUNIUN_MASTER[pl.label]?.[juniun] : undefined
      if (juniunText) {
        push(`  - 十二運の意味（${JUNIUN_PILLAR_THEME[pl.label]}）：${juniunText}`)
      }
    }
    push(
      `- 五行バランス：${ELEMENTS.map((el, i) => `${el}${meishiki.elements[i]}`).join('・')}`,
      `- 陰陽：陰${meishiki.yin}・陽${meishiki.yang}`,
      `- 身強弱：${meishiki.strength.label}（味方＝比劫・印 ${meishiki.strength.ally}／敵＝食傷・財・官 ${meishiki.strength.enemy}）`,
      `  - ${meishiki.strength.desc}`,
    )
    const deficient = meishiki.elements.map((n, i) => ({ n, i })).filter(e => e.n === 0).map(e => e.i)
    for (const i of deficient) {
      const d = GOGYO_DEFICIENCY[i]
      push(
        `- 不足している五行：${ELEMENTS[i]}`,
        `  - 出やすい特徴：${d.traits.join('／')}`,
        `  - 補うアドバイス：${d.advice.join('／')}`,
      )
    }
    push('')
  }

  // 九星気学
  const { honmei, getsumei } = computeKyusei(birth.year, birth.month, birth.day)
  const outer = KYUSEI_STARS[honmei]
  const inner = KYUSEI_STARS[getsumei]
  push(
    '## 九星気学｜本命星×月命星（外側と内側のあなた）',
    `- 組み合わせ：${outer.name} × ${inner.name}`,
    `  - ${KYUSEI_COMBO[`${honmei}-${getsumei}`] ?? ''}`,
    `- 外側のあなた（本命星・周りから見える姿）：${outer.name}（象意：${outer.symbol}／${outer.keywords.join('・')}）`,
    `  - ${KYUSEI_OUTER[honmei]}`,
    `- 内側のあなた（月命星・素の自分）：${inner.name}（象意：${inner.symbol}／${inner.keywords.join('・')}）`,
    `  - ${KYUSEI_INNER[getsumei]}`,
    '',
  )

  // ════════════════ 西洋 ════════════════
  push('# 西洋占星術', '')

  const positions = calculatePlanetPositions(birthday, birthTime, cityCoords)

  // 天体位置
  push('## 天体のサイン')
  for (const k of Object.keys(positions) as PlanetKey[]) {
    if (!usable(k)) continue
    push(`- ${p(k)}：${signOf(positions[k])}`)
  }
  push('')

  // ハウス
  if (hasTime) {
    const cusps = calculateHouseCusps(positions.asc)
    const housePlanets = assignPlanetsToHouses(positions, positions.asc)
    push('## ハウス（イコールハウス方式）')
    cusps.forEach((cusp, i) => {
      const h = i + 1
      const planets = housePlanets[h] ?? []
      push(`- 第${h}ハウス（${signOf(cusp)}）：${planets.length ? planets.map(p).join('・') : '天体なし'}`)
      for (const pk of planets) {
        const text = HOUSE_PLANET_MASTER[`${h}-${pk}`]
        if (text) push(`  - ${p(pk)}：${text}`)
      }
    })
    push('')
  }

  // アスペクト（画面と同じ絞り込み：2天体はASC・MC・DESCを含まないもの、3天体は感受点が1つまで）
  const rawPairs = detectPairAspects(positions, hasTime)
  const pairs = rawPairs
    .filter(pa => !ANGLE_POINTS.includes(pa.planet1) && !ANGLE_POINTS.includes(pa.planet2))
    .filter(pa => usable(pa.planet1, pa.planet2))
    .sort((a, b) => a.orb - b.orb)
  const triples = detectTripleAspects(positions, rawPairs, hasTime)
    .filter(ta => ta.planets.filter(pk => ANGLE_POINTS.includes(pk)).length < 2)
    .filter(ta => usable(...ta.planets))

  const [pairData, tripleData] = await Promise.all([
    prisma.aspectPairData.findMany({ where: { id: { in: pairs.map(pa => pairComboKey(pa.planet1, pa.planet2, pa.aspect)) } } }),
    prisma.aspectTripleData.findMany({ where: { id: { in: triples.map(ta => tripleComboKey(ta.planets)) } } }),
  ])
  const pairMap = new Map(pairData.map((d: { id: string; title: string; description: string }) => [d.id, d]))
  const tripleMap = new Map(tripleData.map((d: { id: string; title: string; description: string }) => [d.id, d]))

  push('## 2天体のアスペクト', '※「強」は合・矩・衝（影響が強く出やすい角度）、「特にラッキー」は吉とされる組み合わせです。')
  if (pairs.length === 0) push('- （該当なし）')
  for (const pa of pairs) {
    const key = pairComboKey(pa.planet1, pa.planet2, pa.aspect)
    const luckyKey = key.split('|').slice(0, 2).join('|')
    const tags = [
      HARD_ASPECT_TYPES.includes(pa.aspect) ? '強' : null,
      LUCKY_PAIR_KEYS.has(luckyKey) ? '特にラッキー' : null,
    ].filter(Boolean)
    const d = pairMap.get(key)
    push(`- ${p(pa.planet1)} × ${p(pa.planet2)}／${ASPECT_NAMES_JA[pa.aspect]}／オーブ${pa.orb.toFixed(1)}°${tags.length ? `／${tags.join('・')}` : ''}`)
    if (d) push(`  - ${d.title ? `${d.title}：` : ''}${d.description}`)
    if (LUCKY_PAIR_KEYS.has(luckyKey) && LUCKY_ASPECT_NOTES[luckyKey]) push(`  - 補足：${LUCKY_ASPECT_NOTES[luckyKey]}`)
  }
  push('')

  push('## 3天体の組み合わせ', '※「特に強い」は3つのうち2つ以上が合・矩・衝のものです。')
  if (triples.length === 0) push('- （該当なし）')
  for (const ta of triples) {
    const key = tripleComboKey(ta.planets)
    const strong = ta.aspects.filter(a => HARD_ASPECT_TYPES.includes(a)).length >= 2
    const tags = [strong ? '特に強い' : null, LUCKY_TRIPLE_KEYS.has(key) ? '特にラッキー' : null].filter(Boolean)
    const d = tripleMap.get(key)
    push(`- ${ta.planets.map(p).join(' × ')}${tags.length ? `／${tags.join('・')}` : ''}`)
    if (d) push(`  - ${d.title ? `${d.title}：` : ''}${d.description}`)
    if (LUCKY_TRIPLE_KEYS.has(key) && LUCKY_ASPECT_NOTES[key]) push(`  - 補足：${LUCKY_ASPECT_NOTES[key]}`)
  }
  push('')

  // ── 出力指示 ──
  push(
    '# 出力してほしい内容',
    '東洋と西洋の結果を統合し、以下の構成で、日本語で3000〜4000字程度にまとめてください。',
    '1. 総合的な人物像：東洋・西洋の両方から見えるあなたの本質',
    '2. 東洋と西洋で一致している特徴（複数の占術が示す、特に確かな性質）',
    '3. 東洋と西洋で食い違っている特徴と、その読み解き方（場面による使い分け、外と内の違いなど）',
    '4. 強み',
    '5. 弱み・気をつけたいところ',
    '6. 恋愛・パートナーシップ',
    '7. 仕事の適性',
    '8. 人間関係',
    '9. 成長のためのヒント',
    '',
    '## 書き方のルール',
    '- 占術に詳しくない人にも分かる言葉で書き、専門用語を使うときは簡単な説明を添えてください。',
    '- それぞれの特徴について、どの占術のどの要素が根拠かを簡潔に示してください。',
    '- 弱みや注意点も、どう活かせばよいかとセットで前向きに書いてください。',
  )

  return lines.join('\n')
}
