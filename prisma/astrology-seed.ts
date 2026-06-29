/**
 * 西洋占星術アスペクト解釈データのシード
 * - AspectPairData:   66ペア × 7アスペクト = 462件
 * - AspectTripleData: C(12,3) = 220件（3天体の組み合わせのみ）
 *
 * 説明文はすべてプレースホルダー（AIによる叩き台）。
 * 後から「決定版 西洋占星術実修」などを参照しながら手作業で修正すること。
 *
 * 実行方法: npx tsx prisma/astrology-seed.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const PLANET_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'asc', 'mc',
] as const

type PlanetKey = (typeof PLANET_KEYS)[number]

const PLANET_INFO: Record<PlanetKey, { ja: string; theme: string; keyword: string }> = {
  sun:     { ja: '太陽', theme: '自我・意志・生命力',         keyword: '意志力'   },
  moon:    { ja: '月',   theme: '感情・直感・内面',           keyword: '感受性'   },
  mercury: { ja: '水星', theme: '思考・言語・知性',           keyword: '思考力'   },
  venus:   { ja: '金星', theme: '愛・美・調和・価値観',       keyword: '美意識'   },
  mars:    { ja: '火星', theme: '行動力・情熱・闘争心',       keyword: '行動力'   },
  jupiter: { ja: '木星', theme: '拡大・発展・幸運・楽観',     keyword: '拡大力'   },
  saturn:  { ja: '土星', theme: '規律・責任・制限・成熟',     keyword: '責任感'   },
  uranus:  { ja: '天王星', theme: '革新・自由・変革・独創性', keyword: '独創性'   },
  neptune: { ja: '海王星', theme: '夢・霊性・直感・曖昧さ',  keyword: '霊感'     },
  pluto:   { ja: '冥王星', theme: '変容・再生・権力・深層心理', keyword: '変革力' },
  asc:     { ja: 'ASC',   theme: '自己表現・外見・第一印象',  keyword: '表現力'   },
  mc:      { ja: 'MC',    theme: '社会的使命・キャリア・目標', keyword: '目標意識' },
}

const ASPECT_KEYS = [
  'conjunction', 'opposition', 'square', 'sextile',
  'trine', 'semisquare', 'sesquiquadrate',
] as const

type AspectKey = (typeof ASPECT_KEYS)[number]

const ASPECT_INFO: Record<AspectKey, { ja: string; deg: number; quality: string }> = {
  conjunction:    { ja: 'コンジャンクション（合）0°',       deg: 0,   quality: '融合・強化' },
  opposition:     { ja: 'オポジション（衝）180°',            deg: 180, quality: '対立・補完' },
  square:         { ja: 'スクエア（矩）90°',                 deg: 90,  quality: '緊張・葛藤' },
  sextile:        { ja: 'セクスタイル（六分）60°',           deg: 60,  quality: '調和・協力' },
  trine:          { ja: 'トライン（三分）120°',              deg: 120, quality: '自然な調和' },
  semisquare:     { ja: 'セミスクエア 45°',                  deg: 45,  quality: '微摩擦・調整' },
  sesquiquadrate: { ja: 'セスキクァドレート 135°',           deg: 135, quality: '内的緊張・成長' },
}

// ─── ペア説明文生成 ───────────────────────────────────────────────────────────

function makePairTitle(p1: PlanetKey, p2: PlanetKey, aspect: AspectKey): string {
  const a = ASPECT_INFO[aspect]
  const n1 = PLANET_INFO[p1].ja
  const n2 = PLANET_INFO[p2].ja
  return `${n1}×${n2} ${a.ja}`
}

function makePairDescription(p1: PlanetKey, p2: PlanetKey, aspect: AspectKey): string {
  const i1 = PLANET_INFO[p1]
  const i2 = PLANET_INFO[p2]
  const a = ASPECT_INFO[aspect]

  const intro: Record<AspectKey, string> = {
    conjunction:
      `${i1.ja}（${i1.theme}）と${i2.ja}（${i2.theme}）がひとつに融合するアスペクトです。` +
      `${i1.keyword}と${i2.keyword}が互いを増幅し合い、性格として非常に強く前面に出てきます。`,
    opposition:
      `${i1.ja}（${i1.theme}）と${i2.ja}（${i2.theme}）が180°向き合う緊張のアスペクトです。` +
      `${i1.keyword}と${i2.keyword}が互いに引き合いながら対立し、意識化することで補完し合えます。`,
    square:
      `${i1.ja}（${i1.theme}）と${i2.ja}（${i2.theme}）が90°で角を作る緊張のアスペクトです。` +
      `${i1.keyword}と${i2.keyword}の間に葛藤が生じやすいですが、乗り越えることで大きな強さになります。`,
    sextile:
      `${i1.ja}（${i1.theme}）と${i2.ja}（${i2.theme}）が60°で協力し合うアスペクトです。` +
      `${i1.keyword}と${i2.keyword}が自然に手を取り合い、才能を活かす機会が生まれやすい配置です。`,
    trine:
      `${i1.ja}（${i1.theme}）と${i2.ja}（${i2.theme}）が120°で流れるように調和するアスペクトです。` +
      `${i1.keyword}と${i2.keyword}が無理なく発揮でき、この組み合わせは生まれながらの才能や恵みをもたらします。`,
    semisquare:
      `${i1.ja}（${i1.theme}）と${i2.ja}（${i2.theme}）が45°で微妙な摩擦を起こすアスペクトです。` +
      `${i1.keyword}と${i2.keyword}の間に小さなズレがあり、意識的に調整することでスムーズに機能します。`,
    sesquiquadrate:
      `${i1.ja}（${i1.theme}）と${i2.ja}（${i2.theme}）が135°で内的な緊張を示すアスペクトです。` +
      `${i1.keyword}と${i2.keyword}の間にくすぶる課題があり、自覚して向き合うことで精神的な成長につながります。`,
  }

  return intro[aspect]
}

// ─── トリプル説明文生成 ───────────────────────────────────────────────────────

function makeTripleKey(planets: PlanetKey[]): string {
  return planets.slice().sort((a, b) => PLANET_KEYS.indexOf(a) - PLANET_KEYS.indexOf(b)).join('|')
}

function makeTripleTitle(planets: PlanetKey[]): string {
  return planets.map(p => PLANET_INFO[p].ja).join('・')
}

function makeTripleDescription(planets: PlanetKey[]): string {
  const infos = planets.map(p => PLANET_INFO[p])
  const names = infos.map(i => i.ja).join('・')
  const keywords = infos.map(i => i.keyword).join('、')
  const themes = infos.map(i => `${i.ja}（${i.theme}）`).join('と')

  return (
    `${themes}が同時に絡み合うトリプルアスペクトです。` +
    `${keywords}という3つのエネルギーが複雑に作用し、` +
    `${names}を統合することがこの配置の人生的テーマとなります。` +
    `この3天体のバランスを意識することで、より豊かな個性と深い洞察が生まれます。`
  )
}

// ─── メイン ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌟 西洋占星術アスペクトデータのシードを開始します...')

  // ── ペアデータ（462件）
  const pairEntries: { id: string; title: string; description: string }[] = []

  for (let i = 0; i < PLANET_KEYS.length; i++) {
    for (let j = i + 1; j < PLANET_KEYS.length; j++) {
      const p1 = PLANET_KEYS[i]
      const p2 = PLANET_KEYS[j]
      for (const aspect of ASPECT_KEYS) {
        pairEntries.push({
          id: `${p1}|${p2}|${aspect}`,
          title: makePairTitle(p1, p2, aspect),
          description: makePairDescription(p1, p2, aspect),
        })
      }
    }
  }

  console.log(`📝 ${pairEntries.length}件のペアアスペクトを登録中...`)
  for (const entry of pairEntries) {
    await prisma.aspectPairData.upsert({
      where: { id: entry.id },
      update: { title: entry.title, description: entry.description },
      create: entry,
    })
  }
  console.log(`✅ ペアアスペクト ${pairEntries.length}件の登録完了`)

  // ── トリプルデータ（220件）
  const tripleEntries: { id: string; title: string; description: string }[] = []
  const seenTriples = new Set<string>()

  for (let i = 0; i < PLANET_KEYS.length; i++) {
    for (let j = i + 1; j < PLANET_KEYS.length; j++) {
      for (let k = j + 1; k < PLANET_KEYS.length; k++) {
        const planets = [PLANET_KEYS[i], PLANET_KEYS[j], PLANET_KEYS[k]]
        const key = makeTripleKey(planets)
        if (!seenTriples.has(key)) {
          seenTriples.add(key)
          tripleEntries.push({
            id: key,
            title: makeTripleTitle(planets),
            description: makeTripleDescription(planets),
          })
        }
      }
    }
  }

  console.log(`📝 ${tripleEntries.length}件のトリプルアスペクトを登録中...`)
  for (const entry of tripleEntries) {
    await prisma.aspectTripleData.upsert({
      where: { id: entry.id },
      update: { title: entry.title, description: entry.description },
      create: entry,
    })
  }
  console.log(`✅ トリプルアスペクト ${tripleEntries.length}件の登録完了`)
  console.log('🎉 西洋占星術データのシード完了！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
