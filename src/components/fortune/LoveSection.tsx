import type { LoveResult } from '@/src/data/love'

/**
 * 恋愛傾向（日柱60干支 × 10テーマ）。
 * 4つのグループを <details> で開閉する（サーバーで描画し、クライアントJSは使わない）。
 */
export function LoveSection({ love }: { love: LoveResult }) {
  const { profile, groups } = love

  return (
    // lang="ja" は word-break:auto-phrase（文節での折り返し）を効かせるため。サイト全体の <html> は現状 lang="en"
    <div className="p-6" lang="ja">
      {/* 一般の人向けの見出しと説明を先に、専門用語はおまけで小さく */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-rose-400" />
          <p className="text-sm text-rose-300 font-bold tracking-wide">あなたの恋愛傾向</p>
          <span className="ml-auto text-[10px] text-slate-600 tracking-wider">四柱推命｜日柱から見た恋愛</span>
        </div>
        <p className="mt-2 pl-3 text-xs text-slate-400 leading-relaxed">恋愛での考え方や振る舞いの傾向です。</p>
      </div>

      <div className="text-center mb-6">
        <p className="text-slate-500 text-xs mb-2">あなたの恋愛タイプは…?</p>
        {/* 日本語を文節で折り返す（「純粋／な表現者」のような不自然な改行を防ぐ） */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-snug [word-break:auto-phrase]">
          {profile.typeName}
        </h2>
        <p className="text-rose-200/80 text-sm leading-relaxed [word-break:auto-phrase]">{profile.summary}</p>
      </div>

      <div className="space-y-2.5">
        {groups.map((g, gi) => (
          <details
            key={g.id}
            open={gi === 0}
            className="group rounded-xl border border-rose-900/30 bg-[#12101f] open:bg-[#151225] transition-colors"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <span className="text-rose-400 text-xs">♡</span>
              <span className="text-sm font-medium text-white">{g.label}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="ml-auto w-4 h-4 text-slate-500 transition-transform group-open:rotate-180"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="px-4 pb-4 space-y-5">
              {g.items.map((r) => (
                <div key={r.id}>
                  <p className="text-[11px] text-rose-400/80 tracking-wide mb-1">{r.themeName}</p>
                  <h3 className="text-sm font-bold text-rose-100 mb-1.5">{r.title}</h3>
                  {r.body.split('\n').map((para, i) => (
                    <p key={i} className="text-sm text-slate-300 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-slate-600 leading-relaxed">
        ※ 日柱（生まれた日の干支）に基づく基本的な恋愛傾向です。命式全体を総合した鑑定ではありません。
      </p>
    </div>
  )
}
