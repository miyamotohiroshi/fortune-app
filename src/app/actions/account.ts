'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { prisma } from '@/src/lib/prisma'
import { getSession } from '@/src/lib/session'
import { calculateZodiacId, calculateGenmeiId } from '@/src/lib/zodiacCalc'

type UpdateErrors = {
  nickname?: string[]
  birthday?: string[]
  general?: string[]
}

export type UpdateFormState = { errors?: UpdateErrors; success?: boolean } | undefined

export async function updateProfile(
  _state: UpdateFormState,
  formData: FormData
): Promise<UpdateFormState> {
  try {
    const session = await getSession()
    if (!session?.userId) redirect('/login')

    const nickname = (formData.get('nickname') as string).trim()
    const birthdayRaw = (formData.get('birthday') as string).trim()
    const birthHour = (formData.get('birthHour') as string).trim()
    const birthMinute = (formData.get('birthMinute') as string).trim()
    const birthCity = (formData.get('birthCity') as string) || null

    const errors: UpdateErrors = {}
    if (!nickname || nickname.length < 1) {
      errors.nickname = ['名前を入力してください']
    }

    let birthdayDate: Date | undefined
    let birthdayIso: string | undefined
    if (!birthdayRaw || !/^\d{8}$/.test(birthdayRaw)) {
      errors.birthday = ['生年月日を8桁の数字で入力してください（例: 19870805）']
    } else {
      const y = parseInt(birthdayRaw.slice(0, 4), 10)
      const m = parseInt(birthdayRaw.slice(4, 6), 10) - 1
      const d = parseInt(birthdayRaw.slice(6, 8), 10)
      const parsed = new Date(y, m, d)
      if (parsed.getFullYear() !== y || parsed.getMonth() !== m || parsed.getDate() !== d) {
        errors.birthday = ['有効な生年月日を入力してください']
      } else {
        birthdayDate = parsed
        birthdayIso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      }
    }

    if (Object.keys(errors).length > 0) {
      return { errors }
    }

    const birthTime =
      birthHour !== '' && birthMinute !== ''
        ? `${birthHour.padStart(2, '0')}:${birthMinute.padStart(2, '0')}`
        : null

    const zodiacDayId = calculateZodiacId(birthdayIso!)
    const genmeiId = calculateGenmeiId(birthdayIso!)

    await prisma.user.update({
      where: { id: session.userId as string },
      data: { nickname, birthday: birthdayDate!, birthTime, birthCity, zodiacDayId, genmeiId },
    })

    return { success: true }
  } catch (e: unknown) {
    if (isRedirectError(e)) throw e
    const msg = e instanceof Error ? e.message : String(e)
    return { errors: { general: [`更新に失敗しました: ${msg}`] } }
  }
}
