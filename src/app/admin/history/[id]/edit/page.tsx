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

  // toISOString()はUTC変換されるためタイムゾーンによって日付がずれる。ローカルの年月日から直接組み立てる
  const y = history.birthday.getFullYear()
  const m = String(history.birthday.getMonth() + 1).padStart(2, '0')
  const d = String(history.birthday.getDate()).padStart(2, '0')
  const birthday = `${y}${m}${d}`
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
