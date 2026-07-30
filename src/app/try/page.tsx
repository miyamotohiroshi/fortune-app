import { redirect } from 'next/navigation'
import { getSession } from '@/src/lib/session'
import TryPage from './TryPage'

export default async function Page() {
  const session = await getSession()

  if (session?.userId) {
    redirect('/result')
  }

  return <TryPage />
}
