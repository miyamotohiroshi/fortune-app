type GenmeiSectionProps = {
  nickname: string
  genmei: {
    name: string
    title: string
    description: string[]
  }
}

export function GenmeiSection({ nickname, genmei }: GenmeiSectionProps) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-violet-600 p-8 text-center text-white">
        <p className="text-violet-200 text-xs font-medium tracking-widest mb-2">元命（月柱の中心星）</p>
        <p className="text-violet-100 text-sm font-medium mb-2">あなたの中心にある星は...?</p>
        <h2 className="text-5xl font-bold mb-4">{genmei.name}</h2>
        <p className="text-lg text-violet-50 font-medium leading-relaxed">{genmei.title}</p>
      </div>
      <div className="p-8 md:p-12">
        <h3 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-violet-500 pl-4">
          {nickname}さんの元命の特徴
        </h3>
        <ul className="space-y-3">
          {genmei.description.map((item, index) => (
            <li key={index} className="flex items-start text-slate-700">
              <span className="text-violet-400 mr-2 mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
