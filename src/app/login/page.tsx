import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/src/lib/session'
import { LoginForm } from './LoginForm'

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect('/result')
  }

  return <LoginForm />
}
