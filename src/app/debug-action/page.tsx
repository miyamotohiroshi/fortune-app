'use client'
import { useActionState } from 'react'
import { testAction } from './actions'

export default function DebugPage() {
  const [state, action, pending] = useActionState(testAction, null)
  return (
    <div>
      <h1>Debug Server Action</h1>
      <form action={action}>
        <button type="submit">Test</button>
      </form>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  )
}
