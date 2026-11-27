/**
 * 結果ページのタイトル下に表示する「生年月日・出生時刻・出生地」の1行。
 * 生年月日はJSTの暦日で表示し、時刻・出生地は未登録なら省略する。
 */
export function BirthInfoLine({
  birthday,
  birthTime,
  birthCity,
}: {
  birthday: Date
  birthTime?: string | null
  birthCity?: string | null
}) {
  const dateLabel = birthday.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <p className="mt-1.5 text-xs text-slate-500 tracking-wide">
      {[dateLabel, birthTime, birthCity].filter(Boolean).join('　')}
    </p>
  )
}
