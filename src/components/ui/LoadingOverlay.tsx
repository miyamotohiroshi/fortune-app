type Props = {
  text?: string
  size?: number
}

// フォーム送信中などに画面全体を覆うローディング表示。呼び出し側で `{pending && <LoadingOverlay />}` のように条件描画する
export function LoadingOverlay({ text = '計算中', size = 180 }: Props) {
  const letters = text.split('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(to bottom, #1e1040, #0d0620, #000000)' }}
    >
      <div
        className="relative flex items-center justify-center select-none"
        style={{ width: size, height: size }}
      >
        {letters.map((letter, index) => (
          <span
            key={index}
            className="inline-block text-white opacity-40 animate-loader-letter"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
        <div className="absolute inset-0 rounded-full animate-loader-circle" />
      </div>
    </div>
  )
}
