'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateZodiacId } from '@/src/lib/zodiacCalc';

export default function Home() {

  const [nickName, setNickName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const router = useRouter();

  const handleDiagnose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) return;

    // 干支IDを計算
    const id = calculateZodiacId(birthDate);

    const name = nickName

    // 結果ページへ遷移（例: /result/55）
    router.push(`/result/${id}?name=${name}`);

  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">四柱推命・60干支診断</h1>
          <p className="text-sm text-slate-500">
            生年月日を入力して、あなたの生まれ持った性格を見てみましょう
          </p>
        </div>

        <form onSubmit={handleDiagnose} className="space-y-6">
          <div>
            <label htmlFor="nickName" className="block text-sm font-medium text-slate-700 mb-2">
              名前（ニックネーム可）
            </label>
            <input
              type="text"
              id="nickName"
              value={nickName}
              onChange={(e) => setNickName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800"
            />
          </div>
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700 mb-2">
              生年月日
            </label>
            <input
              type="date"
              id="birthDate"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
          >
            診断する
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
          ※ 四柱推命の精密な計算に基づき、あなたの生まれた日の干支を算出します。
        </div>


        {/* <h2 className="text-lg border-b border-indigo-500 pb-1 text-indigo-500">peer</h2>
        <div className="text-center mt-8">
          <input type="checkbox" id="detail" className="peer hidden" />
          <label htmlFor="detail" className="py-4 px-8 rounded-lg bg-gray-100  peer-checked:bg-wafu-gold peer-checked:text-red-500 cursor-pointer">
            詳しい解説を表示
          </label>
          <div className="hidden peer-checked:block mt-8 p-4 border border-wafu-gold">
            ここに60干支の詳細な解説文が入ります...
          </div>
        </div>

        <h2 className="text-lg border-b border-indigo-500 pb-1 text-indigo-500 mt-8">Grid</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 md:row-span-2 p-8 border">
            中心星：食神
          </div>

          <div className="bg-white border p-4">年柱</div>
          <div className="bg-white border p-4">月柱</div>
          <div className="bg-white border p-4">日柱</div>
        </div>

        <h2 className="text-lg border-b border-indigo-500 pb-1 text-indigo-500 mt-8">
          あなたの鑑定結果
        </h2>

        <div className="bg-gradient-to-tl from-cyan-200 to-neutral-100 p-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg">
            ここに鑑定内容...
          </div>
        </div>

        <div className="flex space-x-4 mt-8 justify-center">
          <div className="bg-gradient-to-tl from-cyan-200 to-neutral-100 w-10 h-10 flex justify-center items-center rounded-full">１</div>
          <div className="bg-gradient-to-tl from-cyan-200 to-neutral-100 w-10 h-10 flex justify-center items-center rounded-full">２</div>
          <div className="bg-gradient-to-tl from-cyan-200 to-neutral-100 w-10 h-10 flex justify-center items-center rounded-full">３</div>
        </div> */}

      </div>
    </main>
  );
}