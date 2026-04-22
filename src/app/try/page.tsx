'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { calculatePreview } from '@/src/app/actions/fortune'

export default function TryPage() {
  const [state, action, pending] = useActionState(calculatePreview, undefined)

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <p className="text-xs font-medium tracking-widest text-indigo-500 uppercase mb-2">無料体験</p>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">四柱推命・60干支診断</h1>
          <p className="text-sm text-slate-500">
            名前と生年月日だけで、あなたの生まれ持った性格を診断します
          </p>
        </div>

        <form action={action} className="space-y-5">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-slate-700 mb-2">
              名前（ニックネーム可）
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800"
            />
            {state?.errors?.nickname && (
              <p className="mt-1 text-sm text-red-500">{state.errors.nickname[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-slate-700 mb-2">
              生年月日
            </label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800"
            />
            {state?.errors?.birthday && (
              <p className="mt-1 text-sm text-red-500">{state.errors.birthday[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200"
          >
            {pending ? '計算中...' : '今すぐ占う'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
          結果を保存したい方は{' '}
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            会員登録
          </Link>
          {' '}がおすすめです
        </div>

        <div className="mt-3 text-center">
          <Link href="/login" className="text-xs text-slate-400 hover:text-slate-600">
            ログインはこちら
          </Link>
        </div>
      </div>
    </main>
  )
}
