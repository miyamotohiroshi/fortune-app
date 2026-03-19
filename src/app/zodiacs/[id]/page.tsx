import { prisma } from '@/src/lib/prisma'
import { notFound } from 'next/navigation'

export default async function ZodiacDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const zodiac = await prisma.zodiac.findUnique({
    where: { id: parseInt(id) }
  })

  if (!zodiac) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <span className="text-gray-500">第 {zodiac.id} 番</span>
        <h1 className="text-4xl font-bold mt-2">{zodiac.name}</h1>
        <p className="text-xl text-indigo-600 font-medium mt-4">{zodiac.title}</p>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">性格の特徴</h2>
        <ul className="space-y-3">
          {zodiac.description.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <a href="/zodiacs" className="text-sm text-gray-500 hover:underline">← 一覧に戻る</a>
      </div>
    </div>
  )
}