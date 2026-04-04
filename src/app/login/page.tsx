'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/src/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">ログイン</h1>
          <p className="text-sm text-slate-500">
            メールアドレスとパスワードでログインしてください
          </p>
        </div>

        <form action={action} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800"
            />
          </div>

          {state?.errors?.general && (
            <p className="text-sm text-red-500">{state.errors.general[0]}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200"
          >
            {pending ? 'ログイン中...' : 'ログインして占いを見る'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          まだ登録していない方は{' '}
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            新規登録
          </Link>
        </div>
      </div>
    </main>
  )
}
