import Link from 'next/link'

type Props = {
  active: 'self' | 'history'
}

export function AdminTabNav({ active }: Props) {
  const tabClass = (tab: 'self' | 'history') =>
    `px-5 py-2 rounded-full text-sm transition-colors ${
      active === tab
        ? 'text-white font-bold'
        : 'text-slate-400 hover:text-slate-200 font-medium'
    }`

  return (
    <div className="flex justify-center mb-6">
      <div
        className="inline-flex items-center gap-1 rounded-full border border-purple-900/40 p-1"
        style={{ background: 'rgba(20,20,40,0.8)' }}
      >
        <Link
          href="/result"
          className={tabClass('self')}
          style={active === 'self' ? { background: 'linear-gradient(to right, #8b5cf6, #4f46e5)' } : undefined}
        >
          自分の結果
        </Link>
        <Link
          href="/admin/history"
          className={tabClass('history')}
          style={active === 'history' ? { background: 'linear-gradient(to right, #8b5cf6, #4f46e5)' } : undefined}
        >
          占断履歴
        </Link>
      </div>
    </div>
  )
}
