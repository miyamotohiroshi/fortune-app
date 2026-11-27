'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { signup } from '@/src/app/actions/auth'
import { LoadingOverlay } from '@/src/components/ui/LoadingOverlay'
import { CITY_REGIONS } from '@/src/lib/astrology/cities'

// ─── SVGアイコン ──────────────────────────────────────────────────────────────

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

// ─── フォームフィールド ────────────────────────────────────────────────────────

function FormField({
  icon,
  label,
  error,
  children,
}: {
  icon: React.ReactNode
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="flex items-end pb-1 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-[#1a1a3a] border border-purple-900/50 flex items-center justify-center text-purple-400">
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
        {children}
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}

// ─── サインアップフォーム ─────────────────────────────────────────────────────

function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const prefillNickname = searchParams.get('nickname') ?? ''
  // YYYY-MM-DD 形式で来た場合は YYYYMMDD に変換
  const rawBirthday = searchParams.get('birthday') ?? ''
  const prefillBirthday = rawBirthday.match(/^\d{4}-\d{2}-\d{2}$/)
    ? rawBirthday.replace(/-/g, '')
    : rawBirthday
  const rawBirthTime = searchParams.get('birthTime') ?? ''
  const prefillHour = rawBirthTime ? rawBirthTime.split(':')[0] : ''
  const prefillMinute = rawBirthTime ? rawBirthTime.split(':')[1] : ''
  const prefillCity = searchParams.get('birthCity') ?? ''

  const inputClass =
    'w-full bg-[#1a1a3a] border border-purple-900/40 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all'

  const numInputClass =
    'w-16 bg-[#1a1a3a] border border-purple-900/40 rounded-xl px-3 py-3 text-white placeholder-slate-600 text-sm text-center focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  const floatingInputClass =
    'peer w-full bg-[#1a1a3a] border border-purple-900/40 rounded-xl px-4 pt-5 pb-2 h-[54px] text-white text-sm focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all'

  const floatingLabelClass =
    'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none transition-all duration-150 peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:text-purple-400 peer-[&:not(:placeholder-shown)]:top-3 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:text-slate-400'

  return (
    <>
      {pending && <LoadingOverlay text="登録中" />}
      <form action={action} className="space-y-4">
      <FormField icon={<PersonIcon />} label="名前（ニックネーム可）" error={state?.errors?.nickname?.[0]}>
        <input
          type="text"
          name="nickname"
          placeholder="例）ソラ"
          defaultValue={prefillNickname}
          className={inputClass}
        />
      </FormField>

      <FormField icon={<CalendarIcon />} label="生年月日（例: 19870805）" error={state?.errors?.birthday?.[0]}>
        <input
          type="text"
          name="birthday"
          inputMode="numeric"
          maxLength={8}
          placeholder="19870805"
          defaultValue={prefillBirthday}
          className={inputClass}
        />
      </FormField>

      {/* ── 任意項目の区切り ── */}
      <div className="flex items-center gap-2 py-0.5">
        <div className="flex-1 h-px bg-purple-900/30" />
        <span className="text-xs text-slate-500 shrink-0 px-1">─ 分かる場合のみ ─</span>
        <div className="flex-1 h-px bg-purple-900/30" />
      </div>

      <FormField icon={<ClockIcon />} label="生まれた時間" error={undefined}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="birthHour"
            min={0}
            max={23}
            placeholder="--"
            defaultValue={prefillHour}
            className={numInputClass}
          />
          <span className="text-slate-400 text-sm shrink-0">時</span>
          <input
            type="number"
            name="birthMinute"
            min={0}
            max={59}
            placeholder="--"
            defaultValue={prefillMinute}
            className={numInputClass}
          />
          <span className="text-slate-400 text-sm shrink-0">分</span>
        </div>
      </FormField>

      <FormField icon={<MapPinIcon />} label="生まれた都市" error={undefined}>
        <select
          name="birthCity"
          className={`${inputClass} appearance-none`}
          defaultValue={prefillCity}
        >
          <option value="" disabled>選択してください</option>
          {CITY_REGIONS.map(({ label, cities }) => (
            <optgroup key={label} label={label}>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </FormField>

      <p className="text-xs text-slate-500 leading-relaxed ml-[52px] -mt-1">
        ※時間や都市が分かるとより精度が上がります。<br />
        都市は同経度の場所や近い所でOK
      </p>

      {/* ── メールアドレス（フローティングラベル） ── */}
      <div className="flex justify-center" style={{ marginTop: '40px' }}>
        <div className="w-[85%]">
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
          {state?.errors?.email && <p className="mt-1 text-xs text-red-400">{state.errors.email[0]}</p>}
        </div>
      </div>

      {/* ── パスワード（フローティングラベル） ── */}
      <div className="flex justify-center" style={{ marginBottom: '40px' }}>
        <div className="w-[85%]">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder=" "
              className={`${floatingInputClass} pr-12`}
            />
            <label htmlFor="password" className={floatingLabelClass}>
              パスワード（8文字以上）
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {state?.errors?.password && <p className="mt-1 text-xs text-red-400">{state.errors.password[0]}</p>}
        </div>
      </div>

      {state?.errors?.general && (
        <p className="text-xs text-red-400 text-center">{state.errors.general[0]}</p>
      )}

      <div className="pt-2">
        <div
          className={`rounded-xl p-px transition-opacity duration-200 ${pending ? 'opacity-60' : ''}`}
          style={{
            background: 'linear-gradient(to right, #d946ef, #8b5cf6, #4f46e5)',
            boxShadow: '0 4px 30px rgba(139, 92, 246, 0.4)',
          }}
        >
          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center relative text-white font-semibold py-4 rounded-[11px] transition-all duration-200 hover:brightness-110"
            style={{
              background: 'linear-gradient(to right, #2e1065, #1e1b4b)',
            }}
          >
            <span>{pending ? '登録中...' : '登録して占う'}</span>
            {!pending && (
              <span className="absolute right-5 text-purple-300 text-xl leading-none">›</span>
            )}
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500 pt-1">
        すでに登録済みの方は{' '}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
          ログイン
        </Link>
      </p>
      </form>
    </>
  )
}

// ─── 特徴アイテムアイコン ─────────────────────────────────────────────────────

function StarSvg() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
      <path d="M18 4 L19.2 16 L18 18 L16.8 16Z" fill="rgba(200,170,255,0.9)" />
      <path d="M32 18 L20 19.2 L18 18 L20 16.8Z" fill="rgba(167,139,250,0.7)" />
      <path d="M18 32 L16.8 20 L18 18 L19.2 20Z" fill="rgba(200,170,255,0.9)" />
      <path d="M4 18 L16 16.8 L18 18 L16 19.2Z" fill="rgba(167,139,250,0.7)" />
      <circle cx="18" cy="18" r="3" fill="white" opacity="0.9" />
    </svg>
  )
}

function PlanetSvg() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
      <circle cx="18" cy="18" r="8" fill="rgba(100,80,210,0.5)" stroke="rgba(147,112,219,0.6)" strokeWidth="1.5" />
      <ellipse cx="18" cy="18" rx="16" ry="5" stroke="rgba(167,139,250,0.6)" strokeWidth="1.5" transform="rotate(-25 18 18)" fill="none" />
      <circle cx="18" cy="18" r="3" fill="rgba(200,170,255,0.4)" />
    </svg>
  )
}

function OrbitSvg() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
      <circle cx="18" cy="18" r="3" fill="rgba(167,139,250,0.9)" />
      <circle cx="18" cy="18" r="9" stroke="rgba(147,112,219,0.5)" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="18" cy="18" r="15" stroke="rgba(100,80,200,0.3)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="27" cy="18" r="2.5" fill="rgba(200,170,255,0.7)" />
      <circle cx="3" cy="18" r="1.5" fill="rgba(147,112,219,0.5)" />
    </svg>
  )
}

function ChartSvg() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
      <rect x="4" y="22" width="6" height="10" rx="1.5" fill="rgba(147,112,219,0.5)" />
      <rect x="13" y="15" width="6" height="17" rx="1.5" fill="rgba(147,112,219,0.75)" />
      <rect x="22" y="8" width="6" height="24" rx="1.5" fill="rgba(167,139,250,0.95)" />
      <path d="M5 24 L22 10" stroke="rgba(200,170,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M26 6 L30 10 L22 10" stroke="rgba(200,170,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

// ─── 特徴リスト ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: StarSvg,
    title: '性格診断',
    desc: '四柱推命の通変星（元命）と、西洋占星術のアスペクトを掛け合わせ、あなたの本質的な性格を読み解きます。',
  },
  {
    Icon: PlanetSvg,
    title: '1年の運勢',
    desc: '毎年のテーマや運気の流れを詳しく解説。チャンスの時期や注意すべき時期を事前に把握できます。',
  },
  {
    Icon: OrbitSvg,
    title: '直近5年間の運勢',
    desc: '中長期的な運勢の流れを可視化し、人生の転機や成長のタイミングをサポートします。',
  },
  {
    Icon: ChartSvg,
    title: 'あなただけの運命の羅針盤',
    desc: '複数の占術を組み合わせた分析で、あなただけの未来への羅針盤をお届けします。',
  },
]

// ─── ページ本体 ───────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07071A] text-white">

      {/* ── ヒーローセクション（全幅・背景画像） ─────────── */}
      <section className="relative overflow-hidden">
        {/* 背景画像：中央寄せ・端を背景色にフェード */}
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <div
            className="relative h-full w-full max-w-[1100px] bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/hero-bg.webp)' }}
          >
            <div className="absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-[#07071A] to-transparent" />
            <div className="absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-[#07071A] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#07071A] to-transparent" />
          </div>
        </div>

        {/* テキスト */}
        <div className="relative z-10 px-6 pt-24 pb-44 sm:pt-36 sm:pb-64 text-center">
          <h1 className="text-[1.75rem] sm:text-6xl font-bold tracking-[0.08em] sm:tracking-[0.12em] leading-tight whitespace-nowrap">
            四柱推命 × 星占い
          </h1>
          <p className="mt-6 text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            東洋と西洋の占いをかけ合わせて、
            <br />
            あなたの性格と運命をのぞき見します。
          </p>
        </div>
      </section>

      <div className="max-w-md mx-auto">

      {/* ── フォームカード ────────────────────────────── */}
      <section className="relative z-10 px-4 pb-2 -mt-28 sm:-mt-36">
        <div
          className="rounded-3xl border border-purple-900/30 p-6"
          style={{ background: 'rgba(12, 12, 34, 0.97)', backdropFilter: 'blur(12px)', boxShadow: '0 0 60px rgba(90, 50, 180, 0.12)' }}
        >
          <div className="text-center mb-4">
            <p className="text-xs text-slate-500">
              生年月日を入力して、あなたの生まれ持った性格を見てみましょう
            </p>
          </div>

          {/* ダイヤモンド区切り */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-purple-900/50" />
            <div className="w-2 h-2 rotate-45 bg-purple-600/70" />
            <div className="flex-1 h-px bg-purple-900/50" />
          </div>

          <Suspense fallback={<div className="h-80" />}>
            <SignupForm />
          </Suspense>

          <p className="mt-5 text-center text-xs text-slate-700">
            ※ 四柱推命の精密な計算に基づき、あなたの生まれた日の干支を算出します。
          </p>
        </div>
      </section>

      {/* ── 特徴セクション ────────────────────────────── */}
      <section className="px-4 mt-8">
        {/* セクションヘッダー */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-px bg-slate-800" />
          <div className="w-3 h-px bg-purple-700" />
          <span className="text-xs text-slate-400 font-medium px-2 tracking-wider">このアプリでできること</span>
          <div className="w-3 h-px bg-purple-700" />
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <div className="space-y-3">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-4 rounded-2xl border border-slate-800/60 p-4"
              style={{ background: 'rgba(12, 12, 32, 0.8)' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a1240] to-[#0e0a28] border border-purple-900/40 flex items-center justify-center shrink-0">
                <Icon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <div className="text-slate-700 text-xl shrink-0">›</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── フッターバナー ────────────────────────────── */}
      <div className="mx-4 mt-6 mb-8">
        <div
          className="rounded-2xl border border-purple-900/30 p-5 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(30,10,70,0.9) 0%, rgba(20,8,55,0.9) 50%, rgba(30,10,70,0.9) 100%)' }}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-purple-500 text-sm">✦</span>
            <p className="text-white text-sm font-medium">今後も新機能を続々追加予定！</p>
            <span className="text-purple-500 text-sm">✦</span>
          </div>
          <p className="text-slate-500 text-xs mt-1.5">
            より深く、より詳しく、あなたの未来をサポートします
          </p>
        </div>
      </div>

      </div>{/* max-w-md */}
    </div>
  )
}
