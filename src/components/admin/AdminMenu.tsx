'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const MENU = [
  {
    heading: 'メニュー',
    links: [
      { href: '/result', label: '自分の結果' },
      { href: '/admin/history', label: '占断履歴' },
      { href: '/admin/lookup', label: '新しく占断する' },
    ],
  },
  {
    heading: '資料',
    links: [{ href: '/admin/note', label: '占星術ノート', desc: '本の解説をアスペクトごとに引く' }],
  },
]

/** 管理者ナビ右上のハンバーガーと、右から出るメニュー */
export function AdminMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Esc で閉じる・開いている間は背面スクロールを止める
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        aria-expanded={open}
        className="w-11 h-11 rounded-xl bg-[#1a1a3a] border border-purple-900/50 flex items-center justify-center text-purple-300 hover:border-purple-500/70 hover:text-purple-200 transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* 背景オーバーレイ */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden
      />

      {/* 右サイドパネル */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="管理者メニュー"
        className={`fixed top-0 right-0 z-50 h-full w-72 max-w-[85vw] border-l border-purple-900/40 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'linear-gradient(to bottom, #12122e, #0a0a1f)' }}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-purple-900/30">
          <p className="text-xs text-purple-400 tracking-widest">管理者メニュー</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="メニューを閉じる"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="px-3 py-4 space-y-6">
          {MENU.map((section) => (
            <div key={section.heading}>
              <p className="px-3 mb-2 text-[11px] text-slate-500 tracking-widest">{section.heading}</p>
              <ul className="space-y-1">
                {section.links.map((link) => {
                  const active = pathname === link.href
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between rounded-xl px-3 py-3 transition-colors ${
                          active
                            ? 'bg-purple-600/25 text-white'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-medium">{link.label}</span>
                          {'desc' in link && link.desc && (
                            <span className="block mt-0.5 text-[11px] text-slate-500">{link.desc}</span>
                          )}
                        </span>
                        <span className="text-purple-400/70">›</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
