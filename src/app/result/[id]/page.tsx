import { prisma } from '@/src/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ResultPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);

  // DBから該当する干支データを取得
  const zodiac = await prisma.zodiac.findUnique({
    where: { id },
  });

  // データが見つからない場合は404ページへ
  if (!zodiac) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* ヘッダー部分 */}
          <div className="bg-indigo-600 p-8 text-center text-white">
            <p className="text-indigo-100 text-sm font-medium mb-2">あなたの魂のデザインは</p>
            <h1 className="text-5xl font-bold mb-4">{zodiac.name}</h1>
            <p className="text-lg text-indigo-50 + font-medium leading-relaxed">
              {zodiac.title}
            </p>
          </div>

          {/* 内容部分 */}
          <div className="p-8 md:p-12">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-indigo-500 pl-4">
              主な性格の特徴
            </h2>
            
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zodiac.description.map((item, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl text-slate-700 text-sm leading-relaxed"
                >
                  <span className="text-indigo-500 mt-1">✦</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
              <Link 
                href="/"
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors"
              >
                ← 戻って再診断する
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}