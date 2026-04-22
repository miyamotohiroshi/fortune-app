'use server'

import { redirect } from 'next/navigation'
import { calculateZodiacId, calculateGenmeiId } from '@/src/lib/zodiacCalc'

type TryErrors = {
  nickname?: string[]
  birthday?: string[]
}

export type TryFormState = { errors?: TryErrors } | undefined

export async function calculatePreview(
  _state: TryFormState,
  formData: FormData
): Promise<TryFormState> {
  const nickname = formData.get('nickname') as string
  const birthday = formData.get('birthday') as string

  const errors: TryErrors = {}
  if (!nickname || nickname.trim().length < 1) {
    errors.nickname = ['名前を入力してください']
  }
  if (!birthday) {
    errors.birthday = ['生年月日を入力してください']
  }
  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  const zodiacId = calculateZodiacId(birthday)
  const genmeiId = calculateGenmeiId(birthday)

  redirect(
    `/try/result?zodiacId=${zodiacId}&genmeiId=${genmeiId}&nickname=${encodeURIComponent(nickname.trim())}&birthday=${birthday}`
  )
}
