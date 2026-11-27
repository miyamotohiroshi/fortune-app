'use client'

import { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * ページ内のリンクがクリックされてから、遷移先のURLに切り替わるまでの間、画面最上部に細い進行バーを出す。
 * ページに1つ置けば、そのページのすべての内部リンクに効く（管理者ナビ AdminTabNav に置いている）。
 *
 * useLinkStatus はプリフェッチ済みだと pending を飛ばし、また同じ階層内の遷移では loading.tsx が出ないため、
 * サーバー側の計算が重いページでクリック後に何も変化せず「固まった」ように見えていた。
 * ここではクリックそのものを拾うので、プリフェッチの有無に関係なく必ず反応が出る。
 */
export function NavigationProgress() {
  const pathname = usePathname()
  // クリックした時点のパス。URLが切り替わったら（＝遷移が反映されたら）不一致になり、バーが消える
  const [clickedAt, setClickedAt] = useState<string | null>(null)
  const pending = clickedAt !== null && clickedAt === pathname

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      // パスが変わらないリンク（同じページ・ハッシュやクエリだけの変更）は対象外。パスの変化で消す仕組みのため
      if (url.pathname === location.pathname) return
      setClickedAt(location.pathname)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  if (!pending) return null

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] overflow-hidden pointer-events-none"
      style={{ background: 'rgba(139,92,246,0.15)' }}
    >
      <div
        className="absolute inset-y-0 w-1/3 animate-link-pending"
        style={{ background: 'linear-gradient(to right, transparent, #a78bfa, #6366f1, transparent)' }}
      />
    </div>
  )
}

/** 行やボタン内に置く小さなスピナー（<Link> の子に置く）。pending でない間も幅を確保してレイアウトのずれを防ぐ */
export function LinkPendingSpinner() {
  const { pending } = useLinkStatus()
  return (
    <span
      aria-hidden
      className={`inline-block w-3.5 h-3.5 rounded-full border-2 border-purple-400/30 border-t-purple-300 animate-spin transition-opacity ${
        pending ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
