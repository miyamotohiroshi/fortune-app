import { AdminTabNav } from '@/src/components/admin/AdminTabNav'
import {
  ASTRO_NOTE_BODIES,
  ASTRO_NOTE_CATEGORIES,
  ASTRO_NOTE_DATA,
  type AstroNoteCategoryId,
  type AstroNoteItem,
} from '@/src/data/astro-note'
import { AstroNote } from './AstroNote'

// 天体の並び順（ASTRO_NOTE_BODIES の順）→ 組み合わせ解説 → 3天体目の順に並べる
const ORDER = Object.keys(ASTRO_NOTE_BODIES)
const rank = (it: AstroNoteItem) =>
  it.bodies.map((b) => ORDER.indexOf(b)).concat(it.intro ? [-1] : [])

function sortItems(items: AstroNoteItem[]) {
  return [...items].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    for (let i = 0; i < 3; i++) {
      const x = ra[i] ?? -1
      const y = rb[i] ?? -1
      if (x !== y) return x - y
    }
    return 0
  })
}

export default async function AstroNotePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  const initialCat: AstroNoteCategoryId =
    ASTRO_NOTE_CATEGORIES.find((c) => c.id === cat)?.id ?? ASTRO_NOTE_CATEGORIES[0].id

  // データはサーバーで並べ替えて props で渡す（クライアント JS に直接 import しない）
  const data = Object.fromEntries(
    Object.entries(ASTRO_NOTE_DATA).map(([k, v]) => [k, sortItems(v)]),
  ) as Record<AstroNoteCategoryId, AstroNoteItem[]>

  return (
    <div className="min-h-screen bg-[#07071A] text-white">
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">
        <AdminTabNav />

        <div className="mb-2">
          <p className="text-xs text-purple-400 tracking-widest mb-1">管理者メニュー / 資料</p>
          <h1 className="text-3xl font-bold text-white">占星術ノート</h1>
          <p className="mt-1.5 text-xs text-slate-500">本の解説をアスペクトの組み合わせごとに引けます</p>
        </div>

        <AstroNote categories={ASTRO_NOTE_CATEGORIES} bodies={ASTRO_NOTE_BODIES} data={data} initialCat={initialCat} />
      </div>
    </div>
  )
}
