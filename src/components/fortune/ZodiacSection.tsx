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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-indigo-600 p-8 text-center text-white">
        <p className="text-indigo-200 text-xs font-medium tracking-widest mb-2">日柱</p>
        <p className="text-indigo-100 text-sm font-medium mb-2">あなたの性格は...?</p>
        <h1 className="text-5xl font-bold mb-4">{zodiac.name}</h1>
        <p className="text-lg text-indigo-50 font-medium leading-relaxed">{zodiac.title}</p>
      </div>
      <div className="p-8 md:p-12">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-indigo-500 pl-4">
          {nickname}さんの主な性格の特徴
        </h2>
        <ul className="space-y-3">
          {zodiac.description.map((item, index) => (
            <li key={index} className="flex items-start text-slate-700">
              <span className="text-indigo-400 mr-2 mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
