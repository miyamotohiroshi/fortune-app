'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { signup } from '@/src/app/actions/auth'

function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined)
  const searchParams = useSearchParams()
  const prefillNickname = searchParams.get('nickname') ?? ''
  const prefillBirthday = searchParams.get('birthday') ?? ''

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-slate-700 mb-2">
          名前（ニックネーム可）
        </label>
        <input
          type="text"
          id="nickname"
          name="nickname"
          defaultValue={prefillNickname}
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
          defaultValue={prefillBirthday}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800"
        />
        {state?.errors?.birthday && (
          <p className="mt-1 text-sm text-red-500">{state.errors.birthday[0]}</p>
        )}
      </div>

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
        {state?.errors?.email && (
          <p className="mt-1 text-sm text-red-500">{state.errors.email[0]}</p>
        )}
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
        {state?.errors?.password && (
          <p className="mt-1 text-sm text-red-500">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.errors?.general && (
        <p className="text-sm text-red-500">{state.errors.general[0]}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200"
      >
        {pending ? '登録中...' : '登録して占う'}
      </button>
    </form>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">四柱推命・60干支診断</h1>
          <p className="text-sm text-slate-500">
            生年月日を入力して、あなたの生まれ持った性格を見てみましょう
          </p>
        </div>

        <Suspense fallback={<div className="h-64" />}>
          <SignupForm />
        </Suspense>

        <div className="mt-6 text-center text-sm text-slate-500">
          すでに登録済みの方は{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ログイン
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
          ※ 四柱推命の精密な計算に基づき、あなたの生まれた日の干支を算出します。
        </div>
      </div>
    </main>
  )
}
