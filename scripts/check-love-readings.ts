/**
 * 恋愛診断データの品質チェック。
 *   npx tsx scripts/check-love-readings.ts          … 作成済みの干支だけチェック（途中経過用）
 *   npx tsx scripts/check-love-readings.ts --full   … 60干支×10テーマが全部そろっているかもチェック
 *
 * エラーがあれば終了コード1。警告は表示のみ。
 */
import { ALL_LOVE_PROFILES, ALL_LOVE_READINGS, dayPillarName } from '../src/data/love'
import { LOVE_THEMES } from '../src/data/love/themes'

const full = process.argv.includes('--full')
const errors: string[] = []
const warns: string[] = []

const BODY_MIN = 150
const BODY_MAX = 250
/** 性別を決めつける語（異性愛前提・性別役割を避けるため） */
const GENDER_WORDS = ['彼氏', '彼女', '男性', '女性', '男の子', '女の子', '夫', '妻', '旦那', '嫁', '男らしく', '女らしく', '奥さん']
/** 上の語を含むが問題ない語（誤検出の除外） */
const GENDER_WORD_OK = ['大丈夫', '工夫', '丈夫', '夫婦']
/** 異なる干支の同じテーマで、この割合以上の文字 bigram が共通なら「似すぎ」 */
const SIMILARITY_WARN = 0.55

// ── 1. ID の重複・干支名の整合 ───────────────────────────────
const ids = new Set<string>()
for (const r of ALL_LOVE_READINGS) {
  if (ids.has(r.id)) errors.push(`ID重複: ${r.id}`)
  ids.add(r.id)
  if (r.dayPillarId < 1 || r.dayPillarId > 60) errors.push(`干支IDが範囲外: ${r.id}`)
  if (r.dayPillar !== dayPillarName(r.dayPillarId)) errors.push(`干支名の不一致: ${r.id} ${r.dayPillar}`)
}
const profileIds = new Set<number>()
for (const p of ALL_LOVE_PROFILES) {
  if (profileIds.has(p.dayPillarId)) errors.push(`恋愛タイプの重複: ${p.dayPillar}`)
  profileIds.add(p.dayPillarId)
  if (!p.typeName.trim() || !p.summary.trim()) errors.push(`恋愛タイプ名・要約が空: ${p.dayPillar}`)
}

// ── 2. 欠損（作成済みの干支は10テーマ必須。--full なら60干支すべて） ──
const targetIds = full ? Array.from({ length: 60 }, (_, i) => i + 1) : [...profileIds]
for (const id of targetIds) {
  if (!profileIds.has(id)) errors.push(`恋愛タイプなし: ${dayPillarName(id)}(${id})`)
  for (const t of LOVE_THEMES) {
    if (!ALL_LOVE_READINGS.some((r) => r.dayPillarId === id && r.theme === t.id)) {
      errors.push(`欠損: ${dayPillarName(id)}(${id}) ${t.id} ${t.name}`)
    }
  }
}

// ── 3. 本文の中身 ──────────────────────────────────────────
for (const r of ALL_LOVE_READINGS) {
  const len = r.body.replace(/\n/g, '').length
  if (len < BODY_MIN || len > BODY_MAX) warns.push(`文字数 ${len}字（目安${BODY_MIN}〜${BODY_MAX}）: ${r.id}`)
  if (!r.title.trim()) errors.push(`見出しが空: ${r.id}`)
  if (r.interpretationBasis.length === 0) errors.push(`解釈根拠が空: ${r.id}`)
  let text = r.title + r.body
  for (const ok of GENDER_WORD_OK) text = text.split(ok).join('')
  for (const w of GENDER_WORDS) if (text.includes(w)) errors.push(`性別を決めつける語「${w}」: ${r.id}`)
}

// ── 4. 同じテーマで干支間の文章が似すぎていないか ───────────────
const bigrams = (s: string) => {
  const set = new Set<string>()
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2))
  return set
}
for (const t of LOVE_THEMES) {
  const rs = ALL_LOVE_READINGS.filter((r) => r.theme === t.id)
  const grams = rs.map((r) => bigrams(r.body))
  for (let i = 0; i < rs.length; i++) {
    for (let j = i + 1; j < rs.length; j++) {
      const a = grams[i]
      const b = grams[j]
      let common = 0
      for (const g of a) if (b.has(g)) common++
      const sim = common / Math.min(a.size, b.size)
      if (rs[i].body === rs[j].body) errors.push(`本文が完全一致: ${rs[i].id} と ${rs[j].id}`)
      else if (sim >= SIMILARITY_WARN) warns.push(`似すぎ(${Math.round(sim * 100)}%): ${rs[i].id} と ${rs[j].id}`)
    }
  }
  const titles = new Map<string, string>()
  for (const r of rs) {
    if (titles.has(r.title)) warns.push(`見出しが同じ「${r.title}」: ${titles.get(r.title)} と ${r.id}`)
    titles.set(r.title, r.id)
  }
}

// ── 結果 ──────────────────────────────────────────────────
console.log(`恋愛タイプ ${ALL_LOVE_PROFILES.length}件 ／ 鑑定文 ${ALL_LOVE_READINGS.length}件（全体の目標: 60件 ／ 600件）`)
console.log(`作成済みの干支: ${ALL_LOVE_PROFILES.map((p) => p.dayPillar).join('・')}`)
for (const w of warns) console.log(`⚠️  ${w}`)
for (const e of errors) console.log(`❌ ${e}`)
console.log(errors.length ? `\nエラー ${errors.length}件` : `\nエラーなし（警告 ${warns.length}件）`)
process.exit(errors.length ? 1 : 0)
