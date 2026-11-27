'use client'

import { useEffect, useState } from 'react'

type Props = {
  /** カード上部の小さな英字ラベル */
  eyebrow?: string
  title: string
  lead: string
  modalTitle: string
  /** プロンプト本文。開いたときに作る場合は関数で渡す */
  prompt: string | (() => string)
}

// 「AIに貼り付けるプロンプト」を作るボタン（運気・性格で共通）。
// 押すとプレビュー用のモーダルを開き、コピーだけできる（外部AIへの直接遷移はしない）
export function PromptModalButton({ eyebrow = 'AI PROMPT', title, lead, modalTitle, prompt }: Props) {
  const [text, setText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const open = text !== null
  const close = () => setText(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setText(null) }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const copy = async () => {
    if (text === null) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // クリップボードAPIが使えない環境向けのフォールバック
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="rounded-2xl border border-purple-500/30 p-4 mt-4" style={{ background: 'rgba(147,51,234,0.08)' }}>
        <p className="text-[10px] text-purple-400 tracking-widest font-medium">{eyebrow}</p>
        <p className="text-sm font-bold text-white mt-0.5">{title}</p>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{lead}</p>
        <button
          type="button"
          onClick={() => setText(typeof prompt === 'function' ? prompt() : prompt)}
          className="mt-3 w-full py-2.5 rounded-xl bg-purple-600/40 border border-purple-500/50 text-sm font-medium text-purple-100 hover:bg-purple-600/60 transition-colors"
        >
          プロンプトを作成する
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-bold text-white">{modalTitle}</p>
              <button
                type="button"
                onClick={close}
                className="text-slate-400 hover:text-white text-lg leading-none px-1"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <pre className="flex-1 overflow-auto px-4 py-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words font-sans">
              {text}
            </pre>
            <div className="px-4 py-3 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={copy}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
              >
                {copied ? 'コピーしました ✓' : 'プロンプトをコピー'}
              </button>
              <p className="text-[10px] text-slate-500 text-center">
                名前は含まれません。生年月日・出生時刻・出生地は含まれます。
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
