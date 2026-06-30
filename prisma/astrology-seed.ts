/**
 * 西洋占星術アスペクト解釈データのシード
 * - AspectPairData:   66ペア × 7アスペクト = 462件
 * - AspectTripleData: C(12,3) = 220件（3天体の組み合わせのみ）
 *
 * 実行方法: npx tsx prisma/astrology-seed.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { PAIR_DESC_1 } from './pair-desc-1'
import { PAIR_DESC_2 } from './pair-desc-2'
import { PAIR_DESC_3 } from './pair-desc-3'
import { PAIR_DESC_4 } from './pair-desc-4'
import { PAIR_DESC_5 } from './pair-desc-5'
import { TRIPLE_DESC_1 } from './triple-desc-1'
import { TRIPLE_DESC_2 } from './triple-desc-2'
import { TRIPLE_DESC_3 } from './triple-desc-3'
import { TRIPLE_DESC_4 } from './triple-desc-4'

const prisma = new PrismaClient()

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const PLANET_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'asc', 'mc',
] as const

type PlanetKey = (typeof PLANET_KEYS)[number]

const PLANET_INFO: Record<PlanetKey, { ja: string; theme: string; keyword: string }> = {
  sun:     { ja: '太陽',   theme: '自我・意志・生命力',             keyword: '意志力'   },
  moon:    { ja: '月',     theme: '感情・直感・内面',               keyword: '感受性'   },
  mercury: { ja: '水星',   theme: '思考・言語・知性',               keyword: '思考力'   },
  venus:   { ja: '金星',   theme: '愛・美・調和・価値観',           keyword: '美意識'   },
  mars:    { ja: '火星',   theme: '行動力・情熱・闘争心',           keyword: '行動力'   },
  jupiter: { ja: '木星',   theme: '拡大・発展・幸運・楽観',         keyword: '拡大力'   },
  saturn:  { ja: '土星',   theme: '規律・責任・制限・成熟',         keyword: '責任感'   },
  uranus:  { ja: '天王星', theme: '革新・自由・変革・独創性',       keyword: '独創性'   },
  neptune: { ja: '海王星', theme: '夢・霊性・直感・曖昧さ',         keyword: '霊感'     },
  pluto:   { ja: '冥王星', theme: '変容・再生・権力・深層心理',     keyword: '変革力'   },
  asc:     { ja: 'ASC',    theme: '自己表現・外見・第一印象',        keyword: '表現力'   },
  mc:      { ja: 'MC',     theme: '社会的使命・キャリア・目標',      keyword: '目標意識' },
}

const ASPECT_KEYS = [
  'conjunction', 'opposition', 'square', 'sextile',
  'trine', 'semisquare', 'sesquiquadrate',
] as const

type AspectKey = (typeof ASPECT_KEYS)[number]

const ASPECT_INFO: Record<AspectKey, { ja: string; quality: string }> = {
  conjunction:    { ja: 'コンジャンクション（合）0°',      quality: '融合・強化'   },
  opposition:     { ja: 'オポジション（衝）180°',           quality: '対立・補完'   },
  square:         { ja: 'スクエア（矩）90°',                quality: '緊張・葛藤'   },
  sextile:        { ja: 'セクスタイル（六分）60°',          quality: '調和・協力'   },
  trine:          { ja: 'トライン（三分）120°',             quality: '自然な調和'   },
  semisquare:     { ja: 'セミスクエア 45°',                 quality: '微摩擦・調整' },
  sesquiquadrate: { ja: 'セスキクァドレート 135°',          quality: '内的緊張・成長' },
}

// ─── 説明データマージ ─────────────────────────────────────────────────────────

const ALL_PAIR_DESC: Record<string, { title: string; description: string }> = {
  ...PAIR_DESC_1,
  ...PAIR_DESC_2,
  ...PAIR_DESC_3,
  ...PAIR_DESC_4,
  ...PAIR_DESC_5,
}

const ALL_TRIPLE_DESC: Record<string, { title: string; description: string }> = {
  ...TRIPLE_DESC_1,
  ...TRIPLE_DESC_2,
  ...TRIPLE_DESC_3,
  ...TRIPLE_DESC_4,
}

// ─── フォールバック生成（キーが見つからない場合のみ使用）────────────────────

function makePairFallback(p1: PlanetKey, p2: PlanetKey, aspect: AspectKey) {
  const i1 = PLANET_INFO[p1]
  const i2 = PLANET_INFO[p2]
  const a = ASPECT_INFO[aspect]
  return {
    title: `${i1.ja}×${i2.ja} ${a.ja}`,
    description:
      `${i1.ja}（${i1.theme}）と${i2.ja}（${i2.theme}）が${a.ja}を形成します。` +
      `${i1.keyword}と${i2.keyword}が${a.quality}の関係で結びつく配置です。`,
  }
}

function makeTripleKey(planets: PlanetKey[]): string {
  return [...planets].sort((a, b) => PLANET_KEYS.indexOf(a) - PLANET_KEYS.indexOf(b)).join('|')
}

function makeTripleFallback(planets: PlanetKey[]) {
  const names = planets.map(p => PLANET_INFO[p].ja).join('・')
  const keywords = planets.map(p => PLANET_INFO[p].keyword).join('・')
  return {
    title: names,
    description:
      `${names}が同時に絡み合うトリプルアスペクトです。` +
      `${keywords}の3つのエネルギーを統合することが、この配置の人生的テーマとなります。`,
  }
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
        const id = `${p1}|${p2}|${aspect}`
        const data = ALL_PAIR_DESC[id] ?? makePairFallback(p1, p2, aspect)
        pairEntries.push({ id, ...data })
      }
    }
  }

  const pairMissing = pairEntries.filter(e => !(e.id in ALL_PAIR_DESC))
  if (pairMissing.length > 0) {
    console.warn(`⚠️  フォールバック使用: ${pairMissing.length}件のペア説明が未定義`)
    pairMissing.forEach(e => console.warn('   ', e.id))
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
  const seen = new Set<string>()

  for (let i = 0; i < PLANET_KEYS.length; i++) {
    for (let j = i + 1; j < PLANET_KEYS.length; j++) {
      for (let k = j + 1; k < PLANET_KEYS.length; k++) {
        const planets = [PLANET_KEYS[i], PLANET_KEYS[j], PLANET_KEYS[k]] as PlanetKey[]
        const id = makeTripleKey(planets)
        if (!seen.has(id)) {
          seen.add(id)
          const data = ALL_TRIPLE_DESC[id] ?? makeTripleFallback(planets)
          tripleEntries.push({ id, ...data })
        }
      }
    }
  }

  const tripleMissing = tripleEntries.filter(e => !(e.id in ALL_TRIPLE_DESC))
  if (tripleMissing.length > 0) {
    console.warn(`⚠️  フォールバック使用: ${tripleMissing.length}件のトリプル説明が未定義`)
    tripleMissing.forEach(e => console.warn('   ', e.id))
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
