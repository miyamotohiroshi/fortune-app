'use server'

import { redirect } from 'next/navigation'
import { calculateZodiacId, calculateGenmeiId } from '@/src/lib/zodiacCalc'

type TryErrors = {
  nickname?: string[]
  birthday?: string[]
  general?: string[]
}

export type TryFormState = { errors?: TryErrors } | undefined

export async function calculatePreview(
  _state: TryFormState,
  formData: FormData
): Promise<TryFormState> {
  const nickname = (formData.get('nickname') as string).trim()
  const birthdayRaw = (formData.get('birthday') as string).trim()
  const birthHour = formData.get('birthHour') as string
  const birthMinute = formData.get('birthMinute') as string
  const birthCity = formData.get('birthCity') as string

  const errors: TryErrors = {}
  if (!nickname || nickname.length < 1) {
    errors.nickname = ['名前を入力してください']
  }
  if (!birthdayRaw || !/^\d{8}$/.test(birthdayRaw)) {
    errors.birthday = ['生年月日を8桁の数字で入力してください（例: 19870805）']
  } else {
    const y = parseInt(birthdayRaw.slice(0, 4), 10)
    const m = parseInt(birthdayRaw.slice(4, 6), 10) - 1
    const d = parseInt(birthdayRaw.slice(6, 8), 10)
    const parsed = new Date(y, m, d)
    if (parsed.getFullYear() !== y || parsed.getMonth() !== m || parsed.getDate() !== d) {
      errors.birthday = ['有効な生年月日を入力してください']
    }
  }
  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  const y = parseInt(birthdayRaw.slice(0, 4), 10)
  const m = parseInt(birthdayRaw.slice(4, 6), 10)
  const d = parseInt(birthdayRaw.slice(6, 8), 10)
  const birthdayIso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const zodiacId = calculateZodiacId(birthdayIso)
  const genmeiId = calculateGenmeiId(birthdayIso)

  const params = new URLSearchParams({
    zodiacId: String(zodiacId),
    genmeiId: String(genmeiId),
    nickname,
    birthday: birthdayRaw,
  })
  if (birthHour && birthMinute) {
    params.set('birthTime', `${birthHour.padStart(2, '0')}:${birthMinute.padStart(2, '0')}`)
  }
  if (birthCity) {
    params.set('birthCity', birthCity)
  }

  redirect(`/try/result?${params.toString()}`)
}
