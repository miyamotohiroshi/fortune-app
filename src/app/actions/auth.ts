'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import bcrypt from 'bcryptjs'
import { prisma } from '@/src/lib/prisma'
import { createSession, deleteSession } from '@/src/lib/session'
import { calculateZodiacId, calculateGenmeiId } from '@/src/lib/zodiacCalc'

type SignupErrors = {
  nickname?: string[]
  email?: string[]
  password?: string[]
  birthday?: string[]
  general?: string[]
}

export type SignupFormState = { errors?: SignupErrors } | undefined

type LoginErrors = {
  email?: string[]
  password?: string[]
  general?: string[]
}

export type LoginFormState = { errors?: LoginErrors } | undefined

export async function signup(
  _state: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  try {
    const nickname = formData.get('nickname') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const birthdayRaw = (formData.get('birthday') as string).trim()
    const birthHour = (formData.get('birthHour') as string).trim()
    const birthMinute = (formData.get('birthMinute') as string).trim()
    const birthTime =
      birthHour !== '' && birthMinute !== ''
        ? `${birthHour.padStart(2, '0')}:${birthMinute.padStart(2, '0')}`
        : null
    const birthCity = (formData.get('birthCity') as string) || null

    // バリデーション
    const errors: SignupErrors = {}

    if (!nickname || nickname.trim().length < 1) {
      errors.nickname = ['名前を入力してください']
    }
    if (!email || !email.includes('@')) {
      errors.email = ['有効なメールアドレスを入力してください']
    }
    if (!password || password.length < 8) {
      errors.password = ['パスワードは8文字以上で入力してください']
    }

    // 生年月日: 8桁数字 (YYYYMMDD) を検証してDateに変換
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

    // メールアドレス重複チェック
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { errors: { email: ['このメールアドレスはすでに登録されています'] } }
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10)

    // 干支IDと元命IDを計算
    const zodiacDayId = calculateZodiacId(birthdayIso!)
    const genmeiId = calculateGenmeiId(birthdayIso!)

    // ユーザー登録
    const user = await prisma.user.create({
      data: {
        nickname: nickname.trim(),
        email,
        password: hashedPassword,
        birthday: birthdayDate!,
        birthTime,
        birthCity,
        zodiacDayId,
        genmeiId,
      },
    })

    // セッション作成
    await createSession(user.id)

    // 認証前の画面データを新しいユーザーのセッションへ持ち越さない
    revalidatePath('/', 'layout')

    // 結果ページへリダイレクト
    redirect('/result')
  } catch (e: unknown) {
    if (isRedirectError(e)) throw e
    const msg = e instanceof Error ? e.message : String(e)
    return { errors: { general: [`登録に失敗しました: ${msg}`] } }
  }
}

export async function login(
  _state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // バリデーション
    if (!email || !password) {
      return { errors: { general: ['メールアドレスとパスワードを入力してください'] } }
    }

    // ユーザー検索
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { errors: { general: ['メールアドレスまたはパスワードが正しくありません'] } }
    }

    // パスワード確認
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return { errors: { general: ['メールアドレスまたはパスワードが正しくありません'] } }
    }

    // セッション作成
    await createSession(user.id)

    // 別アカウントの管理者履歴など、以前のClient Cacheを破棄する
    revalidatePath('/', 'layout')

    // 結果ページへリダイレクト
    redirect('/result')
  } catch (e: unknown) {
    if (isRedirectError(e)) throw e
    const msg = e instanceof Error ? e.message : String(e)
    return { errors: { general: [`ログインに失敗しました: ${msg}`] } }
  }
}

export async function logout() {
  await deleteSession()
  // ログアウトしたユーザー固有の画面データをClient Cacheに残さない
  revalidatePath('/', 'layout')
  redirect('/')
}
