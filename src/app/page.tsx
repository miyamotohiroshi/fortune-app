import { redirect } from 'next/navigation'
import { getSession } from '@/src/lib/session'
import SignupPage from './SignupPage'

export default async function Home() {
  const session = await getSession()

  if (session?.userId) {
    redirect('/result')
  }

  return <SignupPage />
}
