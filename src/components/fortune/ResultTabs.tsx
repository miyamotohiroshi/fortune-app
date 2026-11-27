'use client'

import { useState } from 'react'
import { PersonalityTabs } from './PersonalityTabs'

const ALL_TABS = [
  { label: '性格占断', sub: '東洋・西洋' },
  { label: '人生', sub: '西洋占星術' },
  { label: '運気', sub: '今年' },
  { label: '相性', sub: '2人の相性' },
]

/** 東洋タブ内の占術ごとの見出し */
function EasternHeading({ title }: { title: string }) {
  return (
    <h2 className="flex items-center gap-3 mb-3 text-base font-bold text-white tracking-wide">
      {title}
      <span className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent" aria-hidden />
    </h2>
  )
}

type Props = {
  /** 性格占断・東洋（四柱推命） */
  shichu: React.ReactNode
  /** 性格占断・東洋（九星気学）。四柱推命の下に表示する */
  kyusei?: React.ReactNode
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

export function ResultTabs({ shichu, kyusei, western, life, transit, compat, openCompat }: Props) {
  const panels = [
    <PersonalityTabs
      key="personality"
      eastern={
        <div className="space-y-8">
          <div>
            <EasternHeading title="四柱推命" />
            {shichu}
          </div>
          {kyusei !== undefined && (
            <div>
              <EasternHeading title="九星気学" />
              {kyusei}
            </div>
          )}
        </div>
      }
      western={western}
    />,
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
