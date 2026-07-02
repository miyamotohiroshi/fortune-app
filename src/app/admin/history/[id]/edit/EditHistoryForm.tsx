'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { updateHistoryEntry } from '@/src/app/actions/adminHistory'

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
  { label: '北海道', cities: ['札幌', '函館', '旭川'] },
  { label: '東北', cities: ['青森', '盛岡', '仙台', '秋田', '山形', '福島'] },
  { label: '関東', cities: ['東京', '横浜', 'さいたま', '千葉', '水戸', '宇都宮', '前橋'] },
  { label: '中部', cities: ['新潟', '富山', '金沢', '福井', '甲府', '長野', '岐阜', '静岡', '浜松', '名古屋', '津'] },
  { label: '近畿', cities: ['大津', '京都', '大阪', '堺', '神戸', '奈良', '和歌山'] },
  { label: '中国', cities: ['鳥取', '松江', '岡山', '広島', '山口'] },
  { label: '四国', cities: ['徳島', '高松', '松山', '高知'] },
  { label: '九州・沖縄', cities: ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '那覇'] },
  { label: '海外', cities: ['ニューヨーク', 'ロサンゼルス', 'ロンドン', 'パリ', 'ベルリン', 'ソウル', '北京', '上海', '台北', '香港', 'バンコク', 'シンガポール', 'シドニー', 'ムンバイ'] },
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

// ─── ページ本体 ───────────────────────────────────────────────────────────────

type Props = {
  id: string
  name: string
  birthday: string
  birthHour: string
  birthMinute: string
  birthCity: string
}

export function EditHistoryForm({ id, name, birthday, birthHour, birthMinute, birthCity }: Props) {
  const updateWithId = updateHistoryEntry.bind(null, id)
  const [state, action, pending] = useActionState(updateWithId, undefined)

  const inputClass =
    'w-full bg-[#1a1a3a] border border-purple-900/40 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all'

  const numInputClass =
    'w-16 bg-[#1a1a3a] border border-purple-900/40 rounded-xl px-3 py-3 text-white placeholder-slate-600 text-sm text-center focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  return (
    <div className="min-h-screen bg-[#07071A] text-white">
      <div className="max-w-md mx-auto">

        <section className="relative overflow-hidden px-6 pt-16 pb-12">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-purple-700/15 blur-3xl pointer-events-none" />
          <div className="absolute top-8 right-8 w-40 h-40 rounded-full bg-blue-700/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 mt-4">
            <p className="text-xs font-medium tracking-widest text-purple-400 uppercase mb-3">管理者メニュー</p>
            <h1 className="text-3xl font-bold tracking-widest leading-tight">
              履歴を編集
            </h1>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              名前や生年月日を変更すると、<br />占い結果も自動的に再計算されます
            </p>
          </div>
        </section>

        <section className="px-4 pb-8">
          <div
            className="rounded-3xl border border-purple-900/30 p-6"
            style={{ background: 'rgba(12,12,34,0.97)', backdropFilter: 'blur(12px)', boxShadow: '0 0 60px rgba(90,50,180,0.12)' }}
          >
            <form action={action} className="space-y-4">
              <FormField icon={<PersonIcon />} label="対象者の名前" error={state?.errors?.name?.[0]}>
                <input
                  type="text"
                  name="nickname"
                  defaultValue={name}
                  placeholder="例）田中太郎"
                  className={inputClass}
                />
              </FormField>

              <FormField icon={<CalendarIcon />} label="生年月日（例: 19870805）" error={state?.errors?.birthday?.[0]}>
                <input
                  type="text"
                  name="birthday"
                  inputMode="numeric"
                  maxLength={8}
                  defaultValue={birthday}
                  placeholder="19870805"
                  className={inputClass}
                />
              </FormField>

              <div className="flex items-center gap-2 py-0.5">
                <div className="flex-1 h-px bg-purple-900/30" />
                <span className="text-xs text-slate-500 shrink-0 px-1">─ 分かる場合のみ ─</span>
                <div className="flex-1 h-px bg-purple-900/30" />
              </div>

              <FormField icon={<ClockIcon />} label="生まれた時間" error={undefined}>
                <div className="flex items-center gap-2">
                  <input type="number" name="birthHour" min={0} max={23} defaultValue={birthHour} placeholder="--" className={numInputClass} />
                  <span className="text-slate-400 text-sm shrink-0">時</span>
                  <input type="number" name="birthMinute" min={0} max={59} defaultValue={birthMinute} placeholder="--" className={numInputClass} />
                  <span className="text-slate-400 text-sm shrink-0">分</span>
                </div>
              </FormField>

              <FormField icon={<MapPinIcon />} label="生まれた都市" error={undefined}>
                <select name="birthCity" className={`${inputClass} appearance-none`} defaultValue={birthCity}>
                  <option value="">選択してください</option>
                  {CITY_REGIONS.map(({ label, cities }) => (
                    <optgroup key={label} label={label}>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </FormField>

              {state?.errors?.general && (
                <p className="text-xs text-red-400 text-center">{state.errors.general[0]}</p>
              )}

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
                    <span>{pending ? '更新中...' : '更新する'}</span>
                    {!pending && <span className="absolute right-5 text-purple-300 text-xl leading-none">›</span>}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-purple-900/20 text-center">
              <Link href={`/admin/history/${id}`} className="block text-xs text-slate-600 hover:text-slate-400 transition-colors">
                ← キャンセルして戻る
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
