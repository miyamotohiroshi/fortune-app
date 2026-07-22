'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { updateProfile } from '@/src/app/actions/account'
import { LoadingOverlay } from '@/src/components/ui/LoadingOverlay'

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

type Props = {
  nickname: string
  email: string
  birthday: string  // YYYYMMDD
  birthHour: string
  birthMinute: string
  birthCity: string
}

export function AccountForm({ nickname, email, birthday, birthHour, birthMinute, birthCity }: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined)

  const inputClass =
    'w-full bg-[#1a1a3a] border border-purple-900/40 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all'

  const readonlyClass =
    'w-full bg-slate-900/40 border border-slate-800/40 rounded-xl px-4 py-3 text-slate-400 text-sm cursor-default select-none'

  const numInputClass =
    'w-16 bg-[#1a1a3a] border border-purple-900/40 rounded-xl px-3 py-3 text-white placeholder-slate-600 text-sm text-center focus:outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  const labelClass = 'block text-xs font-medium text-slate-400 mb-1.5'

  return (
    <div className="min-h-screen bg-[#07071A] text-white">
      {pending && <LoadingOverlay text="保存中" />}

      {/* 背景グロー */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl pointer-events-none" />

      <div className="max-w-md mx-auto px-4 py-12 space-y-6">

        {/* ヘッダー */}
        <div>
          <p className="text-xs text-purple-400 tracking-widest mb-1">ACCOUNT</p>
          <h1 className="text-2xl font-bold text-white">登録情報</h1>
        </div>

        {/* 成功メッセージ */}
        {state?.success && (
          <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-300">
            保存しました
          </div>
        )}

        {/* カード */}
        <div
          className="rounded-3xl border border-purple-900/30 p-6 space-y-5"
          style={{ background: 'rgba(12,12,34,0.97)', backdropFilter: 'blur(12px)' }}
        >
          <form action={action} className="space-y-5">

            {/* 名前 */}
            <div>
              <label className={labelClass}>名前（ニックネーム可）</label>
              <input
                type="text"
                name="nickname"
                defaultValue={nickname}
                className={inputClass}
              />
              {state?.errors?.nickname && (
                <p className="mt-1 text-xs text-red-400">{state.errors.nickname[0]}</p>
              )}
            </div>

            {/* メール（変更不可） */}
            <div>
              <label className={labelClass}>メールアドレス <span className="text-slate-600">（変更不可）</span></label>
              <div className={readonlyClass}>{email}</div>
            </div>

            {/* 生年月日 */}
            <div>
              <label className={labelClass}>生年月日（例: 19870805）</label>
              <input
                type="text"
                name="birthday"
                inputMode="numeric"
                maxLength={8}
                placeholder="19870805"
                defaultValue={birthday}
                className={inputClass}
              />
              {state?.errors?.birthday && (
                <p className="mt-1 text-xs text-red-400">{state.errors.birthday[0]}</p>
              )}
              <p className="mt-1.5 text-xs text-slate-500">変更すると占い結果が再計算されます</p>
            </div>

            {/* 区切り */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-purple-900/30" />
              <span className="text-xs text-slate-500 shrink-0 px-1">任意項目</span>
              <div className="flex-1 h-px bg-purple-900/30" />
            </div>

            {/* 生まれた時間 */}
            <div>
              <label className={labelClass}>生まれた時間</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="birthHour"
                  min={0}
                  max={23}
                  placeholder="--"
                  defaultValue={birthHour}
                  className={numInputClass}
                />
                <span className="text-slate-400 text-sm shrink-0">時</span>
                <input
                  type="number"
                  name="birthMinute"
                  min={0}
                  max={59}
                  placeholder="--"
                  defaultValue={birthMinute}
                  className={numInputClass}
                />
                <span className="text-slate-400 text-sm shrink-0">分</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">設定するとASC・MCも計算されます</p>
            </div>

            {/* 生まれた都市 */}
            <div>
              <label className={labelClass}>生まれた都市</label>
              <select
                name="birthCity"
                defaultValue={birthCity}
                className={`${inputClass} appearance-none`}
              >
                <option value="">未設定</option>
                {CITY_REGIONS.map(({ label, cities }) => (
                  <optgroup key={label} label={label}>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {state?.errors?.general && (
              <p className="text-xs text-red-400 text-center">{state.errors.general[0]}</p>
            )}

            {/* 保存ボタン */}
            <div className="pt-1">
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
                  <span>{pending ? '保存中...' : '変更を保存する'}</span>
                  {!pending && <span className="absolute right-5 text-purple-300 text-xl leading-none">›</span>}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 戻るリンク */}
        <div className="text-center">
          <Link
            href="/result"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← 占い結果に戻る
          </Link>
        </div>

      </div>
    </div>
  )
}
