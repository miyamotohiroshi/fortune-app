'use client'

import { useState } from 'react'

const SUB_TABS = [
  { label: '東洋', sub: '四柱推命' },
  { label: '西洋', sub: '西洋占星術' },
]

type Props = {
  eastern: React.ReactNode
  western: React.ReactNode
}

export function PersonalityTabs({ eastern, western }: Props) {
  const [active, setActive] = useState(0)
  const panels = [eastern, western]

  return (
    <div>
      {/* 東洋｜西洋 サブタブ（セグメント型） */}
      <div className="flex gap-1 p-1 mb-5 rounded-xl bg-[#12122e] border border-purple-900/40">
        {SUB_TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={[
              'flex-1 py-2 rounded-lg text-center transition-colors',
              active === i
                ? 'bg-purple-600/30 text-white'
                : 'text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span className="block text-[10px] mt-0.5 opacity-70">{tab.sub}</span>
          </button>
        ))}
      </div>

      {/* サブタブコンテンツ */}
      {panels[active]}
    </div>
  )
}
