import { prisma } from '@/src/lib/prisma'
import { getSession } from '@/src/lib/session'
import { redirect } from 'next/navigation'
import { AccountForm } from './AccountForm'

export default async function AccountPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.userId as string } })
  if (!user) redirect('/login')

  // birthdayはJST深夜0時で保存されるため、toISOString()だと前日にズレる。JSTの暦日で解釈する
  const iso = user.birthday.toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' }) // "YYYY-MM-DD"
  const birthday = iso.replace(/-/g, '') // "YYYYMMDD"

  const [birthHour, birthMinute] = user.birthTime ? user.birthTime.split(':') : ['', '']

  return (
    <AccountForm
      nickname={user.nickname}
      email={user.email}
      birthday={birthday}
      birthHour={birthHour}
      birthMinute={birthMinute}
      birthCity={user.birthCity ?? ''}
    />
  )
}
