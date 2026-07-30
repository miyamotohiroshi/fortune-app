'use client'

import { useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { signup } from '@/src/app/actions/auth'
import { LoadingOverlay } from '@/src/components/ui/LoadingOverlay'

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

// ─── 都市リスト ───────────────────────────────────────────────────────────────

const CITY_REGIONS = [
  {
    label: '北海道',
    cities: ['札幌', '函館', '旭川'],
  },
  {
    label: '東北',
    cities: ['青森', '盛岡', '仙台', '秋田', '山形', '福島'],
  },
  {
    label: '関東',
    cities: ['東京', '横浜', 'さいたま', '千葉', '水戸', '宇都宮', '前橋'],
  },
  {
    label: '中部',
    cities: ['新潟', '富山', '金沢', '福井', '甲府', '長野', '岐阜', '静岡', '浜松', '名古屋', '津'],
  },
  {
    label: '近畿',
    cities: ['大津', '京都', '大阪', '堺', '神戸', '奈良', '和歌山'],
  },
  {
    label: '中国',
    cities: ['鳥取', '松江', '岡山', '広島', '山口'],
  },
  {
    label: '四国',
    cities: ['徳島', '高松', '松山', '高知'],
  },
  {
    label: '九州・沖縄',
    cities: ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '那覇'],
  },
  {
    label: '海外',
    cities: [
      'ニューヨーク', 'ロサンゼルス', 'ロンドン', 'パリ', 'ベルリン',
      'ソウル', '北京', '上海', '台北', '香港', 'バンコク', 'シンガポール',
      'シドニー', 'ムンバイ',
    ],
  },
]

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
      <div className="max-w-md mx-auto">

      {/* ── ヒーローセクション ────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-16 pb-12">

        {/* 背景グロー */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-purple-700/15 blur-3xl pointer-events-none" />
        <div className="absolute top-8 right-8 w-48 h-48 rounded-full bg-blue-700/10 blur-2xl pointer-events-none" />
        <div className="absolute -top-10 left-1/4 w-64 h-64 rounded-full bg-indigo-900/20 blur-3xl pointer-events-none" />

        {/* 星（小さな白い点） */}
        {[
          [8,10],[20,6],[38,17],[62,4],[78,13],[14,28],[88,22],[52,8],[34,24],[73,18],[90,8],[5,40]
        ].map(([x, y], i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white pointer-events-none"
            style={{ left: `${x}%`, top: `${y}%`, width: i % 3 === 0 ? '2px' : '1px', height: i % 3 === 0 ? '2px' : '1px', opacity: 0.5 + (i % 3) * 0.15 }}
          />
        ))}

        {/* 月 */}
        <div
          className="absolute top-6 right-6 w-28 h-28 rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 pointer-events-none"
          style={{ boxShadow: '0 0 50px 12px rgba(110, 60, 220, 0.4), 0 0 100px 30px rgba(80, 40, 180, 0.15)' }}
        />

        {/* 星座の幾何学線 */}
        <svg className="absolute top-0 right-0 w-72 h-72 opacity-20 pointer-events-none" viewBox="0 0 288 288">
          <line x1="195" y1="18" x2="238" y2="78" stroke="white" strokeWidth="0.5" />
          <line x1="238" y1="78" x2="195" y2="128" stroke="white" strokeWidth="0.5" />
          <line x1="195" y1="18" x2="258" y2="38" stroke="white" strokeWidth="0.5" />
          <line x1="258" y1="38" x2="268" y2="98" stroke="white" strokeWidth="0.5" />
          <line x1="268" y1="98" x2="238" y2="78" stroke="white" strokeWidth="0.5" />
          <line x1="195" y1="128" x2="225" y2="160" stroke="white" strokeWidth="0.5" />
          <circle cx="195" cy="18" r="2" fill="white" opacity="0.9" />
          <circle cx="238" cy="78" r="2.5" fill="white" opacity="0.9" />
          <circle cx="195" cy="128" r="1.5" fill="white" opacity="0.7" />
          <circle cx="258" cy="38" r="1.5" fill="white" opacity="0.6" />
          <circle cx="268" cy="98" r="1" fill="white" opacity="0.5" />
          <circle cx="225" cy="160" r="1" fill="white" opacity="0.4" />
        </svg>

        {/* テキスト */}
        <div className="relative z-10 mt-6">
          <h1 className="text-4xl font-bold tracking-[0.15em] leading-tight">
            星を読み解き、
            <br />
            本質を知る。
          </h1>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            四柱推命と西洋占星術から導く、
            <br />
            あなただけの性格と運命の羅針盤
          </p>
        </div>

        {/* ドットインジケーター */}
        <div className="relative z-10 flex items-center justify-center gap-2 mt-8">
          <div className="w-5 h-px bg-purple-700/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-2 h-2 rounded-full bg-white" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-5 h-px bg-purple-700/60" />
        </div>
      </section>

      {/* ── フォームカード ────────────────────────────── */}
      <section className="px-4 pb-2">
        <div
          className="rounded-3xl border border-purple-900/30 p-6"
          style={{ background: 'rgba(12, 12, 34, 0.97)', backdropFilter: 'blur(12px)', boxShadow: '0 0 60px rgba(90, 50, 180, 0.12)' }}
        >
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-white">四柱推命・60干支診断</h2>
            <p className="text-xs text-slate-500 mt-1">
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
