type ZodiacSectionProps = {
  nickname: string
  zodiac: {
    name: string
    title: string
    description: string[]
  }
}

export function ZodiacSection({ nickname, zodiac }: ZodiacSectionProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-4 rounded-full bg-indigo-500" />
        <p className="text-xs text-indigo-400 font-medium tracking-widest">日柱</p>
      </div>
      <div className="text-center mb-6">
        <p className="text-slate-500 text-xs mb-2">あなたの性格は…?</p>
        <h2 className="text-5xl font-bold text-white mb-3">{zodiac.name}</h2>
        <p className="text-indigo-300 text-sm font-medium">{zodiac.title}</p>
      </div>
      <div>
        <p className="text-xs text-slate-600 mb-3">{nickname}さんの主な性格の特徴</p>
        <ul className="space-y-2.5">
          {zodiac.description.map((item, index) => (
            <li key={index} className="flex items-start text-slate-300 text-sm leading-relaxed">
              <span className="text-indigo-500 mr-2 mt-0.5 shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
