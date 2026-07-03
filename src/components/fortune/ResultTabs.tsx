'use client'

import { useState } from 'react'

const ALL_TABS = [
  { label: '性格占断', sub: '四柱推命' },
  { label: '性格占断', sub: '西洋占星術' },
  { label: '人生', sub: '西洋占星術' },
  { label: '運気', sub: '今年' },
]

type Props = {
  tab0: React.ReactNode
  tab1: React.ReactNode
  tab2: React.ReactNode
  tab3?: React.ReactNode
}

export function ResultTabs({ tab0, tab1, tab2, tab3 }: Props) {
  const [active, setActive] = useState(0)
  const panels = [tab0, tab1, tab2, ...(tab3 !== undefined ? [tab3] : [])]
  const tabs = ALL_TABS.slice(0, panels.length)

  return (
    <div>
      {/* タブナビゲーション */}
      <div className="flex border-b border-slate-800 mb-5">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={[
              'flex-1 py-3 text-center text-xs leading-tight transition-colors',
              active === i
                ? 'border-b-2 border-purple-400 text-white'
                : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent',
            ].join(' ')}
          >
            <span className="block font-semibold">{tab.label}</span>
            <span className="block text-[10px] mt-0.5 opacity-70">（{tab.sub}）</span>
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {panels[active]}
    </div>
  )
}
