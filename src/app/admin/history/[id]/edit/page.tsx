import { prisma } from '@/src/lib/prisma'
import { getCurrentUser } from '@/src/lib/session'
import { notFound } from 'next/navigation'
import { EditHistoryForm } from './EditHistoryForm'

export default async function EditHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  const history = await prisma.fortuneHistory.findUnique({ where: { id } })
  if (!history || history.adminUserId !== user!.id) {
    notFound()
  }

  // birthdayはJST深夜0時で保存される。getFullYear()等はサーバーのローカルタイムゾーン依存で
  // 本番(Vercel)はUTCがデフォルトのためズレる。明示的にJSTの暦日として解釈する
  const birthday = history.birthday
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' })
    .replace(/-/g, '')
  const [birthHour, birthMinute] = history.birthTime ? history.birthTime.split(':') : ['', '']

  return (
    <EditHistoryForm
      id={history.id}
      name={history.name}
      birthday={birthday}
      birthHour={birthHour}
      birthMinute={birthMinute}
      birthCity={history.birthCity ?? ''}
    />
  )
}
