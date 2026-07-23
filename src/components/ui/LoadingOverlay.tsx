type Props = {
  text?: string
  size?: number
  /** true(既定): 画面全体を覆う固定オーバーレイ。false: ページの一部（例: loading.tsxのコンテンツ領域）に収まるインライン表示 */
  fullScreen?: boolean
}

// フォーム送信中などに画面全体を覆うローディング表示。呼び出し側で `{pending && <LoadingOverlay />}` のように条件描画する
export function LoadingOverlay({ text = '計算中', size = 180, fullScreen = true }: Props) {
  const letters = text.split('')

  return (
    <div
      className={
        fullScreen
          ? 'fixed inset-0 z-50 flex items-center justify-center'
          : 'flex items-center justify-center py-24'
      }
      style={fullScreen ? { background: 'linear-gradient(to bottom, #1e1040, #0d0620, #000000)' } : undefined}
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
