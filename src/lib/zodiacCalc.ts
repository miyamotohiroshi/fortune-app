/**
 * 生年月日から干支ID(1-60)を算出する
 */
export function calculateZodiacId(birthDate: string): number {
  const selectedDate = new Date(birthDate);
  // 基準日: 2000年1月1日 (干支ID: 55 戊午)
  const baseDate = new Date('2000-01-01');

  // 基準日からの経過日数（ミリ秒 → 日数）
  const diffTime = selectedDate.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 基準日のIDが55なので、経過日数を足して60のサイクルに回す
  // 余りが0にならないよう調整
  let zodiacId = (55 + diffDays) % 60;
  if (zodiacId <= 0) zodiacId += 60;

  return zodiacId;
}