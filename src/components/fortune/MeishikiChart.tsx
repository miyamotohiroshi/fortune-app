'use client'

import { useState } from 'react'
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
import { GOGYO_DEFICIENCY } from '@/src/data/gogyo-deficiency'
import { JUNIUN_MASTER, JUNIUN_PILLAR_THEME } from '@/src/data/juniun-master'

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

  // クリックで開いている十二運（柱ラベル＋運星名）
  const [openJuniun, setOpenJuniun] = useState<{ label: string; stage: string } | null>(null)

  // 各行のセル配列を作る小ヘルパー
  const isDay = (p: Pillar) => p.label === '日'

  const toggleJuniun = (label: string, stage: string) => {
    setOpenJuniun((cur) => (cur && cur.label === label && cur.stage === stage ? null : { label, stage }))
  }

  // 五行・陰陽・身強弱の表示用に派生値を算出
  const maxEl = Math.max(1, ...meishiki.elements)
  const yyTotal = meishiki.yin + meishiki.yang
  const yinPct = yyTotal > 0 ? (meishiki.yin / yyTotal) * 100 : 50
  const strengthStyle =
    meishiki.strength.label === '身強'
      ? { bg: 'rgba(244,63,94,0.18)', color: '#fda4af' }
      : meishiki.strength.label === '身弱'
        ? { bg: 'rgba(56,189,248,0.18)', color: '#7dd3fc' }
        : { bg: 'rgba(148,163,184,0.18)', color: '#e2e8f0' }

  // 不足している五行（個数0）のインデックス
  const deficient = meishiki.elements
    .map((n, i) => ({ n, i }))
    .filter((e) => e.n === 0)
    .map((e) => e.i)

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

            {/* 十二運（パワー） クリックで下に説明を表示 */}
            <Row label={<>十二運<br /><span className="text-[9px] text-slate-600">(パワー)</span></>}>
              {pillars.map((p) => {
                const stage = p.juniUn === null ? null : JUNI_UN[p.juniUn]
                const isOpen = !!stage && openJuniun?.label === p.label && openJuniun?.stage === stage
                return (
                  <Cell key={p.label} highlight={isDay(p)}>
                    {p.juniUn === null || stage === null ? (
                      <span className="text-slate-600 text-xs">{DASH}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleJuniun(p.label, stage)}
                        aria-expanded={isOpen}
                        className={`inline-flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer hover:bg-purple-500/10 ${
                          isOpen ? 'bg-purple-500/15 ring-1 ring-purple-400/50' : ''
                        }`}
                      >
                        <span className={`text-xs font-medium underline decoration-dotted decoration-purple-400/50 underline-offset-2 ${
                          isOpen ? 'text-purple-200' : 'text-purple-300'
                        }`}>
                          {stage}
                        </span>
                        <PowerStars power={juniUnPower(p.juniUn)} />
                      </button>
                    )}
                  </Cell>
                )
              })}
            </Row>

          </tbody>
        </table>
      </div>

      {/* 十二運の説明（クリックで開閉） */}
      {openJuniun && JUNIUN_MASTER[openJuniun.label]?.[openJuniun.stage] && (
        <div
          className="mt-3 rounded-xl border border-purple-400/30 p-4"
          style={{ background: 'rgba(30,22,60,0.6)' }}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-purple-200">
                {openJuniun.label}柱の十二運「{openJuniun.stage}」
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpenJuniun(null)}
              className="text-slate-500 hover:text-slate-300 text-xs shrink-0"
              aria-label="閉じる"
            >
              閉じる ✕
            </button>
          </div>
          <p className="text-[11px] text-purple-300/70 mb-2">{JUNIUN_PILLAR_THEME[openJuniun.label]}</p>
          <p className="text-sm text-slate-300 leading-relaxed">
            {JUNIUN_MASTER[openJuniun.label][openJuniun.stage]}
          </p>
        </div>
      )}

      {/* 五行・陰陽・身強弱 */}
      <div className="mt-6 space-y-4">

        {/* 五行バランス */}
        <div>
          <p className="text-[11px] text-slate-500 mb-2 tracking-wider">五行バランス</p>
          <div className="grid grid-cols-5 gap-2">
            {ELEMENTS.map((el, i) => {
              const s = ELEMENT_STYLE[i]
              const n = meishiki.elements[i]
              const pct = maxEl > 0 ? (n / maxEl) * 100 : 0
              return (
                <div
                  key={el}
                  className="flex flex-col items-center gap-1 rounded-lg py-2 px-1"
                  style={{ backgroundColor: s.bg }}
                >
                  <span className="text-sm font-bold leading-none" style={{ color: s.color }}>{el}</span>
                  <span className="text-lg font-bold leading-none text-white">{n}</span>
                  <span className="w-full h-1 rounded-full bg-black/30 overflow-hidden">
                    <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 不足している五行の特徴とアドバイス */}
        {deficient.length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500 tracking-wider">
              不足している五行（{deficient.map((i) => ELEMENTS[i]).join('・')}）
            </p>
            {deficient.map((i) => {
              const s = ELEMENT_STYLE[i]
              const d = GOGYO_DEFICIENCY[i]
              return (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden border border-white/5"
                  style={{ background: 'rgba(20,16,45,0.55)' }}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-2.5"
                    style={{ backgroundColor: s.bg }}
                  >
                    <span className="text-lg font-bold leading-none" style={{ color: s.color }}>{ELEMENTS[i]}</span>
                    <span className="text-xs font-medium" style={{ color: s.color }}>が不足ぎみ</span>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1.5">こんな特徴が出やすい</p>
                      <ul className="space-y-1.5">
                        {d.traits.map((t, k) => (
                          <li key={k} className="flex items-start text-xs text-slate-300 leading-relaxed">
                            <span className="mr-2 mt-0.5 shrink-0" style={{ color: s.color }}>•</span>
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1.5">補って運気を上げるヒント</p>
                      <ul className="space-y-1.5">
                        {d.advice.map((a, k) => (
                          <li key={k} className="flex items-start text-xs text-slate-300 leading-relaxed">
                            <span className="mr-2 mt-0.5 shrink-0 text-amber-400/80">✦</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 陰陽バランス */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] text-slate-500 tracking-wider">陰陽バランス</p>
            <p className="text-[11px] text-slate-400">
              <span className="text-slate-300">陰 {meishiki.yin}</span>
              <span className="mx-1.5 text-slate-600">/</span>
              <span className="text-amber-300">陽 {meishiki.yang}</span>
            </p>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-black/30">
            <span className="bg-slate-500/70" style={{ width: `${yinPct}%` }} />
            <span className="bg-amber-400/70" style={{ width: `${100 - yinPct}%` }} />
          </div>
        </div>

        {/* 身強・身弱 */}
        <div className="rounded-xl border border-purple-900/40 p-4" style={{ background: 'rgba(20,16,45,0.6)' }}>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="inline-flex items-center rounded-md px-3 py-1 text-base font-bold"
              style={{ backgroundColor: strengthStyle.bg, color: strengthStyle.color }}
            >
              {meishiki.strength.label}
            </span>
            <span className="text-[11px] text-slate-500">
              味方（比劫・印）<span className="text-slate-300 font-medium">{meishiki.strength.ally}</span>
              <span className="mx-1.5 text-slate-600">/</span>
              敵（食傷・財・官）<span className="text-slate-300 font-medium">{meishiki.strength.enemy}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{meishiki.strength.desc}</p>
        </div>

        <p className="text-[10px] text-slate-600 leading-relaxed">
          ※ 五行・陰陽は天干・地支の8字を各1点で集計。身強弱は日主を強める星（比肩・劫財・偏印・印綬）と弱める星の比較で、月支（月令）を重めに見て判定しています。
        </p>
      </div>

      {hourUnknown && (
        <p className="mt-3 text-[11px] text-slate-600 leading-relaxed">
          ※ 出生時刻が未登録のため、時柱を除いた七字で算出しています。会員情報で出生時刻を登録すると時柱も反映されます。
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
