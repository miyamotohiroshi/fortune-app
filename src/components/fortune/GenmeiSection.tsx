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
    <div className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-4 rounded-full bg-violet-500" />
        <p className="text-xs text-violet-400 font-medium tracking-widest">通変星（元命）</p>
      </div>
      <div className="text-center mb-6">
        <p className="text-slate-500 text-xs mb-2">あなたの中心にある星は…?</p>
        <h2 className="text-5xl font-bold text-white mb-3">{genmei.name}</h2>
        <p className="text-violet-300 text-sm font-medium">{genmei.title}</p>
      </div>
      <div>
        <p className="text-xs text-slate-600 mb-3">{nickname}さんの元命の特徴</p>
        <ul className="space-y-2.5">
          {genmei.description.map((item, index) => (
            <li key={index} className="flex items-start text-slate-300 text-sm leading-relaxed">
              <span className="text-violet-500 mr-2 mt-0.5 shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
