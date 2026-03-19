import { prisma } from '@/src/lib/prisma'
import Link from 'next/link'

export default async function ZodiacListPage() {
  // DBから全データを取得（ID順）
  const zodiacs = await prisma.zodiac.findMany({
    orderBy: { id: 'asc' }
  })

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">六十干支一覧</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {zodiacs.map((z) => (
          <Link 
            key={z.id} 
            href={`/zodiacs/${z.id}`}
            className="border rounded-lg p-4 hover:bg-slate-50 transition-colors text-center shadow-sm"
          >
            <span className="text-sm text-gray-500">No.{z.id}</span>
            <div className="text-xl font-bold">{z.name}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}