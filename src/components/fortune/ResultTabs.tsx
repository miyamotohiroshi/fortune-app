'use client'

import { useState } from 'react'
import { PersonalityTabs } from './PersonalityTabs'

const ALL_TABS = [
  { label: '性格占断', sub: '東洋・西洋' },
  { label: '人生', sub: '西洋占星術' },
  { label: '運気', sub: '今年' },
  { label: '相性', sub: '2人の相性' },
]

type Props = {
  /** 性格占断・東洋（四柱推命） */
  shichu: React.ReactNode
  /** 性格占断・西洋（西洋占星術） */
  western: React.ReactNode
  /** 人生（西洋占星術） */
  life: React.ReactNode
  /** 運気（今年） */
  transit?: React.ReactNode
  /** 相性（2人のシナストリー） */
  compat?: React.ReactNode
  /** 初期表示で相性タブを開く（履歴一覧からの遷移用） */
  openCompat?: boolean
}

export function ResultTabs({ shichu, western, life, transit, compat, openCompat }: Props) {
  const panels = [
    <PersonalityTabs key="personality" eastern={shichu} western={western} />,
    life,
    ...(transit !== undefined ? [transit] : []),
    ...(compat !== undefined ? [compat] : []),
  ]
  // 相性タブは常に末尾。openCompat のときは初期選択を相性タブにする
  const [active, setActive] = useState(openCompat && compat !== undefined ? panels.length - 1 : 0)
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
