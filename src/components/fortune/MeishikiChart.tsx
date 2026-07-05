import {
  STEMS,
  BRANCHES,
  ELEMENTS,
  TSUHENSEI,
  JUNI_UN,
  stemElement,
  stemIsYang,
  branchElement,
  branchIsYang,
  juniUnPower,
  type Meishiki,
  type Pillar,
} from '@/src/lib/meishikiCalc'

type MeishikiChartProps = {
  meishiki: Meishiki
}

// 五行ごとの配色（ダークテーマ向け・淡い着色＋文字色）
const ELEMENT_STYLE = [
  { color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)' },  // 木
  { color: '#fda4af', bg: 'rgba(244,63,94,0.13)' },   // 火
  { color: '#fcd34d', bg: 'rgba(245,158,11,0.13)' },  // 土
  { color: '#e2e8f0', bg: 'rgba(148,163,184,0.15)' }, // 金
  { color: '#7dd3fc', bg: 'rgba(56,189,248,0.12)' },  // 水
]

const DASH = '—'

/** (五行・陰陽) の小さな注記 */
function ElementNote({ el, yang }: { el: number; yang: boolean }) {
  return (
    <span className="text-[10px] leading-none text-slate-500">
      {ELEMENTS[el]}・{yang ? '陽' : '陰'}
    </span>
  )
}

/** ★★☆☆☆ 形式のパワー表示 */
function PowerStars({ power }: { power: number }) {
  return (
    <span className="text-[10px] tracking-tight text-amber-400/90">
      {'★'.repeat(power)}
      <span className="text-slate-700">{'☆'.repeat(5 - power)}</span>
    </span>
  )
}

export function MeishikiChart({ meishiki }: MeishikiChartProps) {
  const { pillars, hourUnknown } = meishiki

  // 各行のセル配列を作る小ヘルパー
  const isDay = (p: Pillar) => p.label === '日'

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-4 rounded-full bg-purple-500" />
        <p className="text-xs text-purple-400 font-medium tracking-widest">命式図</p>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              <th className="w-14" />
              {pillars.map((p) => (
                <th
                  key={p.label}
                  className={`py-1.5 text-xs font-medium tracking-widest ${
                    isDay(p) ? 'text-indigo-300' : 'text-slate-400'
                  }`}
                >
                  {p.label}柱
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="align-middle">

            {/* 天干 */}
            <Row label="天干">
              {pillars.map((p) => (
                <Cell key={p.label} highlight={isDay(p)}>
                  {p.stem === null ? (
                    <span className="text-slate-600 text-lg">{DASH}</span>
                  ) : (
                    <ElementBox el={stemElement(p.stem)}>
                      <span className="text-lg font-bold leading-none">{STEMS[p.stem]}</span>
                      <ElementNote el={stemElement(p.stem)} yang={stemIsYang(p.stem)} />
                      <span
                        className={`text-[9px] leading-none ${
                          p.hasRoot ? 'text-emerald-400/90' : 'text-slate-600'
                        }`}
                      >
                        {p.hasRoot ? '通根' : '無根'}
                      </span>
                    </ElementBox>
                  )}
                </Cell>
              ))}
            </Row>

            {/* 地支 */}
            <Row label="地支">
              {pillars.map((p) => (
                <Cell key={p.label} highlight={isDay(p)}>
                  {p.branch === null ? (
                    <span className="text-slate-600 text-lg">{DASH}</span>
                  ) : (
                    <ElementBox el={branchElement(p.branch)}>
                      <span className="text-lg font-bold leading-none">{BRANCHES[p.branch]}</span>
                      <ElementNote el={branchElement(p.branch)} yang={branchIsYang(p.branch)} />
                    </ElementBox>
                  )}
                </Cell>
              ))}
            </Row>

            {/* 蔵干 */}
            <Row label="蔵干">
              {pillars.map((p) => {
                const main = p.hidden.length ? p.hidden[p.hidden.length - 1] : null
                return (
                  <Cell key={p.label} highlight={isDay(p)}>
                    {main === null ? (
                      <span className="text-slate-600 text-lg">{DASH}</span>
                    ) : (
                      <ElementBox el={stemElement(main)}>
                        <span className="text-base font-bold leading-none">{STEMS[main]}</span>
                        <ElementNote el={stemElement(main)} yang={stemIsYang(main)} />
                        <span className="text-[9px] leading-none text-slate-600">
                          ({p.hidden.map((s) => STEMS[s]).join('')})
                        </span>
                      </ElementBox>
                    )}
                  </Cell>
                )
              })}
            </Row>

            {/* 通変星（天干） */}
            <Row label={<>通変星<br /><span className="text-[9px] text-slate-600">(天干)</span></>}>
              {pillars.map((p) => (
                <Cell key={p.label} highlight={isDay(p)}>
                  <span className="text-xs text-slate-300">
                    {p.tsuhenStem ? TSUHENSEI[p.tsuhenStem] : isDay(p) ? '日主' : DASH}
                  </span>
                </Cell>
              ))}
            </Row>

            {/* 通変星（地支） */}
            <Row label={<>通変星<br /><span className="text-[9px] text-slate-600">(地支)</span></>}>
              {pillars.map((p) => (
                <Cell key={p.label} highlight={isDay(p)}>
                  <span className="text-xs text-slate-300">
                    {p.tsuhenBranch ? TSUHENSEI[p.tsuhenBranch] : DASH}
                  </span>
                </Cell>
              ))}
            </Row>

            {/* 十二運（パワー） */}
            <Row label={<>十二運<br /><span className="text-[9px] text-slate-600">(パワー)</span></>}>
              {pillars.map((p) => (
                <Cell key={p.label} highlight={isDay(p)}>
                  {p.juniUn === null ? (
                    <span className="text-slate-600 text-xs">{DASH}</span>
                  ) : (
                    <span className="inline-flex flex-col items-center gap-0.5">
                      <span className="text-xs text-slate-300">{JUNI_UN[p.juniUn]}</span>
                      <PowerStars power={juniUnPower(p.juniUn)} />
                    </span>
                  )}
                </Cell>
              ))}
            </Row>

          </tbody>
        </table>
      </div>

      {hourUnknown && (
        <p className="mt-3 text-[11px] text-slate-600 leading-relaxed">
          ※ 出生時刻が未登録のため、時柱は算出していません。会員情報で出生時刻を登録すると時柱も表示されます。
        </p>
      )}
    </div>
  )
}

// ─── レイアウト部品 ──────────────────────────────────────────────────────────

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <tr className="border-t border-purple-900/20">
      <th className="py-2 pr-2 text-right text-[10px] font-medium text-slate-500 leading-tight whitespace-nowrap">
        {label}
      </th>
      {children}
    </tr>
  )
}

function Cell({ highlight, children }: { highlight: boolean; children: React.ReactNode }) {
  return (
    <td className={`py-2 px-1 ${highlight ? 'bg-indigo-500/[0.06]' : ''}`}>
      <div className="flex items-center justify-center">{children}</div>
    </td>
  )
}

/** 五行で着色した角丸ボックス */
function ElementBox({ el, children }: { el: number; children: React.ReactNode }) {
  const s = ELEMENT_STYLE[el]
  return (
    <span
      className="inline-flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 min-w-[2.75rem]"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {children}
    </span>
  )
}
