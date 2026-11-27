import { computeKyusei, toJstYmd, KYUSEI_NAMES } from '@/src/lib/kyuseiCalc'
import {
  computeKyuseiDirections,
  type Direction,
  type DirectionBoard,
  type DirectionCell,
  type DirectionRank,
} from '@/src/lib/kyuseiDirection'
import { KYUSEI_STARS, KYUSEI_OUTER, KYUSEI_INNER, KYUSEI_COMBO } from '@/src/data/kyusei-master'
import {
  DIRECTION_GUIDE,
  DIRECTION_RANK_TEXT,
  BAD_REASON_TEXT,
  STAR_LUCK_TEXT,
} from '@/src/data/kyusei-direction-master'

type KyuseiSectionProps = {
  nickname: string
  /** 生年月日（日本時間の暦日） */
  birth: { year: number; month: number; day: number }
}

/** 地図と同じく上が北になるように並べる（中央は自宅） */
const GRID: (Direction | null)[] = ['北西', '北', '北東', '西', null, '東', '南西', '南', '南東']

const RANK_STYLE: Record<DirectionRank, { cell: string; badge: string; text: string }> = {
  最大吉方: {
    cell: 'border-amber-400/60 bg-amber-400/15',
    badge: 'bg-amber-400/20 text-amber-200',
    text: 'text-amber-200',
  },
  吉方: {
    cell: 'border-emerald-400/50 bg-emerald-400/10',
    badge: 'bg-emerald-400/15 text-emerald-200',
    text: 'text-emerald-200',
  },
  凶方位: {
    cell: 'border-rose-500/40 bg-rose-500/10',
    badge: 'bg-rose-500/15 text-rose-200',
    text: 'text-rose-300',
  },
  ふつう: {
    cell: 'border-slate-700/60 bg-slate-800/20',
    badge: 'bg-slate-700/40 text-slate-400',
    text: 'text-slate-500',
  },
}

function formatPeriod({ start, end }: { start: string; end: string }): string {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  return sy === ey
    ? `${sy}年${sm}月${sd}日〜${em}月${ed}日`
    : `${sy}年${sm}月${sd}日〜${ey}年${em}月${ed}日`
}

function SectionHeading({ title, label, lead }: { title: string; label: string; lead: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-teal-400" />
        <p className="text-sm text-teal-300 font-bold tracking-wide [word-break:auto-phrase]">{title}</p>
        <span className="ml-auto shrink-0 text-[10px] text-slate-600 tracking-wider">{label}</span>
      </div>
      <p className="mt-2 pl-3 text-xs text-slate-400 leading-relaxed">{lead}</p>
    </div>
  )
}

function DirectionGrid({ board }: { board: DirectionBoard }) {
  const byDir = new Map(board.cells.map((c) => [c.direction, c]))
  return (
    <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto" role="img" aria-label={`${board.type}の方位図（上が北）`}>
      {GRID.map((dir, i) => {
        if (!dir) {
          return (
            <div key={i} className="aspect-square rounded-lg border border-slate-700/40 flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-500">自宅</span>
            </div>
          )
        }
        const cell = byDir.get(dir)!
        const style = RANK_STYLE[cell.rank]
        return (
          <div
            key={dir}
            className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5 ${style.cell}`}
          >
            <span className="text-sm font-bold text-white">{dir}</span>
            <span className={`text-[10px] font-medium ${style.text}`}>{cell.rank === 'ふつう' ? '—' : cell.rank}</span>
          </div>
        )
      })}
    </div>
  )
}

function DirectionList({ cells }: { cells: DirectionCell[] }) {
  const order: DirectionRank[] = ['最大吉方', '吉方', '凶方位']
  return (
    <div className="space-y-3">
      {order.map((rank) => {
        const items = cells.filter((c) => c.rank === rank)
        if (items.length === 0) return null
        const style = RANK_STYLE[rank]
        return (
          <div key={rank}>
            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${style.badge}`}>
              {rank}
            </span>
            <ul className="space-y-1.5">
              {items.map((c) => (
                <li key={c.direction} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                  <span className="font-bold text-white shrink-0 w-8">{c.direction}</span>
                  {rank === '凶方位' ? (
                    <span>
                      {c.badReasons.map((r) => `${r}（${BAD_REASON_TEXT[r].short}）`).join('、')}
                    </span>
                  ) : (
                    <span>
                      {c.star !== 5 && (
                        <>
                          <span className={style.text}>{STAR_LUCK_TEXT[c.star].theme}</span>
                          <span className="text-slate-400">：{STAR_LUCK_TEXT[c.star].body}</span>
                        </>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function BoardBlock({ board, title, body }: { board: DirectionBoard; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-teal-900/30 bg-[#0e1420] p-4 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-[11px] text-teal-300/80 mt-0.5">{formatPeriod(board.period)}</p>
        <p className="text-xs text-slate-400 leading-relaxed mt-2">{body}</p>
      </div>
      <DirectionGrid board={board} />
      <DirectionList cells={board.cells} />
    </div>
  )
}

export function KyuseiSection({ nickname, birth }: KyuseiSectionProps) {
  const { honmei, getsumei } = computeKyusei(birth.year, birth.month, birth.day)
  const outer = KYUSEI_STARS[honmei]
  const inner = KYUSEI_STARS[getsumei]
  const combo = KYUSEI_COMBO[`${honmei}-${getsumei}`]

  // 吉方位は「今日」の年盤・月盤で出す（日本時間）
  const directions = computeKyuseiDirections(toJstYmd(new Date()), honmei, getsumei)

  return (
    <div
      className="rounded-2xl p-px"
      style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #4f46e5 50%, #0d9488 100%)' }}
    >
      {/* lang="ja" は word-break:auto-phrase（文節での折り返し）を効かせるため */}
      <div className="rounded-[15px] overflow-hidden" style={{ background: 'rgba(9, 9, 25, 0.98)' }} lang="ja">

        {/* ── 性格（本命星 × 月命星） ── */}
        <div className="p-6">
          <SectionHeading
            title="外側と内側のあなた"
            label="九星気学｜本命星×月命星"
            lead="周りから見えるあなたと、親しい人だけが知っている素のあなた。二つの面から見た性格です。"
          />

          <div className="text-center mb-6">
            <p className="text-slate-500 text-xs mb-2">あなたの星は…?</p>
            <h2 className="text-2xl font-bold text-white leading-snug [word-break:auto-phrase]">
              {outer.name}
              <span className="text-teal-400 mx-2 text-lg">×</span>
              {inner.name}
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed text-left">{combo}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { side: '外側のあなた', role: '本命星', star: outer, text: KYUSEI_OUTER[honmei] },
              { side: '内側のあなた', role: '月命星', star: inner, text: KYUSEI_INNER[getsumei] },
            ].map((b) => (
              <div key={b.side} className="rounded-xl border border-teal-900/30 bg-[#0e1420] p-4">
                <p className="text-[11px] text-teal-400/80 tracking-wide">
                  {b.side}
                  <span className="text-slate-600">（{b.role}）</span>
                </p>
                <h3 className="text-base font-bold text-white mt-1">{b.star.name}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  象意：{b.star.symbol}｜{b.star.keywords.join('・')}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">{b.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-600 leading-relaxed">
            本命星は生まれた年（立春で区切る）、月命星は生まれた月（毎月の節入りで区切る）から決まります。
          </p>
        </div>

        <div className="mx-6 border-t border-purple-900/30" />

        {/* ── 吉方位（年盤・月盤） ── */}
        <div className="p-6">
          <SectionHeading
            title={`${nickname}さんの吉方位`}
            label="九星気学｜年盤・月盤"
            lead={DIRECTION_GUIDE.intro}
          />

          {directions.bothGood.length > 0 && (
            <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 mb-4">
              <p className="text-[11px] text-amber-300 tracking-wide">{DIRECTION_GUIDE.bothGood.title}</p>
              <p className="text-xl font-bold text-white mt-1">{directions.bothGood.join('・')}</p>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{DIRECTION_GUIDE.bothGood.body}</p>
            </div>
          )}

          <div className="space-y-4">
            <BoardBlock board={directions.year} title={DIRECTION_GUIDE.year.title} body={DIRECTION_GUIDE.year.body} />
            <BoardBlock board={directions.month} title={DIRECTION_GUIDE.month.title} body={DIRECTION_GUIDE.month.body} />
          </div>

          {/* 用語と使い方（開閉式） */}
          <details className="group mt-4 rounded-xl border border-slate-800 bg-[#0e1420]">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-medium text-white">方位の見方と用語の説明</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="ml-auto w-4 h-4 text-slate-500 transition-transform group-open:rotate-180"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="px-4 pb-4 space-y-4 text-sm text-slate-300 leading-relaxed">
              <p>{DIRECTION_GUIDE.howToMeasure}</p>
              <div className="space-y-2">
                {(['最大吉方', '吉方', '凶方位'] as const).map((r) => (
                  <p key={r}>
                    <span className={`font-bold ${RANK_STYLE[r].text}`}>{DIRECTION_RANK_TEXT[r].label}</span>
                    <span className="text-slate-400">：{DIRECTION_RANK_TEXT[r].body}</span>
                  </p>
                ))}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">凶方位の種類</p>
                <ul className="space-y-2">
                  {Object.entries(BAD_REASON_TEXT).map(([name, t]) => (
                    <li key={name}>
                      <span className="font-bold text-rose-300">{name}</span>
                      <span className="text-[11px] text-slate-500">（{t.reading}）</span>
                      <span className="text-slate-400">：{t.body}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[11px] text-slate-600">
                方位図は地図と同じく上が北です。今年の中央の星は{KYUSEI_NAMES[directions.year.center]}、今月の中央の星は
                {KYUSEI_NAMES[directions.month.center]}です。
              </p>
            </div>
          </details>
        </div>

      </div>
    </div>
  )
}
