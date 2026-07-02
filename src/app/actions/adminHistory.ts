'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/src/lib/prisma'
import { getCurrentUser } from '@/src/lib/session'
import { calculateZodiacId, calculateGenmeiId } from '@/src/lib/zodiacCalc'

type LookupErrors = {
  name?: string[]
  birthday?: string[]
  general?: string[]
}

export type LookupFormState = { errors?: LookupErrors } | undefined

export async function lookupAndSaveHistory(
  _state: LookupFormState,
  formData: FormData
): Promise<LookupFormState> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { errors: { general: ['権限がありません'] } }
  }

  const name = (formData.get('nickname') as string).trim()
  const birthdayRaw = (formData.get('birthday') as string).trim()
  const birthHour = formData.get('birthHour') as string
  const birthMinute = formData.get('birthMinute') as string
  const birthCity = formData.get('birthCity') as string

  const errors: LookupErrors = {}
  if (!name || name.length < 1) {
    errors.name = ['名前を入力してください']
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
  const birthday = new Date(y, m - 1, d)

  const zodiacDayId = calculateZodiacId(birthdayIso)
  const genmeiId = calculateGenmeiId(birthdayIso)
  const birthTime = birthHour && birthMinute ? `${birthHour.padStart(2, '0')}:${birthMinute.padStart(2, '0')}` : null

  const history = await prisma.fortuneHistory.upsert({
    where: { adminUserId_name_birthday: { adminUserId: user.id, name, birthday } },
    update: { birthTime, birthCity: birthCity || null, zodiacDayId, genmeiId },
    create: { adminUserId: user.id, name, birthday, birthTime, birthCity: birthCity || null, zodiacDayId, genmeiId },
  })

  redirect(`/admin/history/${history.id}`)
}

export async function updateHistoryEntry(
  id: string,
  _state: LookupFormState,
  formData: FormData
): Promise<LookupFormState> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { errors: { general: ['権限がありません'] } }
  }

  const existing = await prisma.fortuneHistory.findUnique({ where: { id } })
  if (!existing || existing.adminUserId !== user.id) {
    return { errors: { general: ['履歴が見つかりません'] } }
  }

  const name = (formData.get('nickname') as string).trim()
  const birthdayRaw = (formData.get('birthday') as string).trim()
  const birthHour = formData.get('birthHour') as string
  const birthMinute = formData.get('birthMinute') as string
  const birthCity = formData.get('birthCity') as string

  const errors: LookupErrors = {}
  if (!name || name.length < 1) {
    errors.name = ['名前を入力してください']
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
  const birthday = new Date(y, m - 1, d)

  const zodiacDayId = calculateZodiacId(birthdayIso)
  const genmeiId = calculateGenmeiId(birthdayIso)
  const birthTime = birthHour && birthMinute ? `${birthHour.padStart(2, '0')}:${birthMinute.padStart(2, '0')}` : null

  try {
    await prisma.fortuneHistory.update({
      where: { id },
      data: { name, birthday, birthTime, birthCity: birthCity || null, zodiacDayId, genmeiId },
    })
  } catch (e: unknown) {
    // instanceofはバンドラー環境でモジュール実体がずれ判定に失敗することがあるため、codeプロパティで判定する
    // (adapter経由だとPrismaの正規化前のPostgres生SQLSTATE "23505" が渡ることがある)
    const code = (e as { code?: string } | null)?.code
    if (code === 'P2002' || code === '23505') {
      return { errors: { general: ['同じ名前・生年月日の履歴がすでに存在します'] } }
    }
    throw e
  }

  revalidatePath('/admin/history')
  redirect(`/admin/history/${id}`)
}

export async function deleteHistory(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    throw new Error('権限がありません')
  }

  await prisma.fortuneHistory.deleteMany({
    where: { id, adminUserId: user.id },
  })

  revalidatePath('/admin/history')
}
