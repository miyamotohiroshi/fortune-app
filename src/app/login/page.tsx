'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { login } from '@/src/app/actions/auth'

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)
  const [showPassword, setShowPassword] = useState(false)

  const floatingInputClass =
    'peer w-full bg-[#1a1a3a] border border-purple-900/40 rounded-xl px-4 pt-5 pb-2 h-[54px] text-white text-sm focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all'

  const floatingLabelClass =
    'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none transition-all duration-150 peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:text-purple-400 peer-[&:not(:placeholder-shown)]:top-3 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:text-slate-400'

  return (
    <div className="min-h-screen bg-[#07071A] text-white flex flex-col items-center justify-center px-4">

      {/* 背景グロー */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">

        {/* タイトル */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-5 h-px bg-purple-700/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <div className="w-5 h-px bg-purple-700/60" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">ログイン</h1>
          <p className="text-sm text-slate-400">星読みを続けましょう</p>
        </div>

        {/* カード */}
        <div
          className="rounded-3xl border border-purple-900/30 p-8"
          style={{ background: 'rgba(12,12,34,0.97)', backdropFilter: 'blur(12px)', boxShadow: '0 0 60px rgba(90,50,180,0.12)' }}
        >
          {/* ダイヤモンド区切り */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-purple-900/50" />
            <div className="w-2 h-2 rotate-45 bg-purple-600/70" />
            <div className="flex-1 h-px bg-purple-900/50" />
          </div>

          <form action={action} className="space-y-4">

            {/* メールアドレス */}
            <div className="relative">
              <input
                id="email"
                type="email"
                name="email"
                placeholder=" "
                className={floatingInputClass}
              />
              <label htmlFor="email" className={floatingLabelClass}>
                メールアドレス
              </label>
            </div>

            {/* パスワード */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder=" "
                className={`${floatingInputClass} pr-12`}
              />
              <label htmlFor="password" className={floatingLabelClass}>
                パスワード
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {state?.errors?.general && (
              <p className="text-xs text-red-400 text-center">{state.errors.general[0]}</p>
            )}

            {/* ログインボタン */}
            <div className="pt-2">
              <div
                className={`rounded-xl p-px transition-opacity duration-200 ${pending ? 'opacity-60' : ''}`}
                style={{ background: 'linear-gradient(to right, #d946ef, #8b5cf6, #4f46e5)', boxShadow: '0 4px 30px rgba(139,92,246,0.4)' }}
              >
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full flex items-center justify-center relative text-white font-semibold py-4 rounded-[11px] transition-all duration-200 hover:brightness-110"
                  style={{ background: 'linear-gradient(to right, #2e1065, #1e1b4b)' }}
                >
                  <span>{pending ? 'ログイン中...' : 'ログインして占いを見る'}</span>
                  {!pending && <span className="absolute right-5 text-purple-300 text-xl leading-none">›</span>}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-purple-900/20 text-center text-sm text-slate-500">
            まだ登録していない方は{' '}
            <Link href="/" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
