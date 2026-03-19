'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateZodiacId } from '@/src/lib/zodiacCalc';

export default function Home() {
  const [birthDate, setBirthDate] = useState('');
  const router = useRouter();

  const handleDiagnose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) return;

    // 干支IDを計算
    const id = calculateZodiacId(birthDate);

    // 結果ページへ遷移（例: /result/55）
    router.push(`/result/${id}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">四柱推命・60干支診断</h1>
          <p className="text-sm text-slate-500">
            生年月日を入力して、あなたの魂のデザイン（干支）を調べましょう。
          </p>
        </div>

        <form onSubmit={handleDiagnose} className="space-y-6">
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
      </div>
    </main>
  );
}