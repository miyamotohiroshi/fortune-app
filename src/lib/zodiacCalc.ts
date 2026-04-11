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

// ─── 元命（月柱の地支通変星）計算 ───────────────────────────────────────────

// 五行インデックス: 0=木, 1=火, 2=土, 3=金, 4=水
const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4] // 甲乙丙丁戊己庚辛壬癸

// 陰陽: 1=陽(+), 0=陰(-)
const STEM_POLARITY = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0] // 甲乙丙丁戊己庚辛壬癸

// 相克: CONTROLS[i] = i が克する五行
// 木(0)克土(2), 火(1)克金(3), 土(2)克水(4), 金(3)克木(0), 水(4)克火(1)
const CONTROLS = [2, 3, 4, 0, 1]

// 月支の本気（天干インデックス）
// 子(0)=壬(8), 丑(1)=己(5), 寅(2)=甲(0), 卯(3)=乙(1), 辰(4)=戊(4),
// 巳(5)=丙(2), 午(6)=丁(3), 未(7)=己(5), 申(8)=庚(6), 酉(9)=辛(7),
// 戌(10)=戊(4), 亥(11)=壬(8)
const MONTH_BRANCH_MAIN_STEM = [8, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8]

/**
 * 生年月日から月支インデックス(0-11)を取得する
 * 節気の近似日を使用（子=0, 丑=1, 寅=2, ... 亥=11）
 */
function getMonthBranchIndex(date: Date): number {
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (month === 1)  return day <= 5  ? 0 : 1   // 子 or 丑
  if (month === 2)  return day <= 3  ? 1 : 2   // 丑 or 寅
  if (month === 3)  return day <= 5  ? 2 : 3   // 寅 or 卯
  if (month === 4)  return day <= 4  ? 3 : 4   // 卯 or 辰
  if (month === 5)  return day <= 5  ? 4 : 5   // 辰 or 巳
  if (month === 6)  return day <= 5  ? 5 : 6   // 巳 or 午
  if (month === 7)  return day <= 6  ? 6 : 7   // 午 or 未
  if (month === 8)  return day <= 7  ? 7 : 8   // 未 or 申
  if (month === 9)  return day <= 7  ? 8 : 9   // 申 or 酉
  if (month === 10) return day <= 7  ? 9 : 10  // 酉 or 戌
  if (month === 11) return day <= 6  ? 10 : 11 // 戌 or 亥
  return day <= 6 ? 11 : 0                     // 亥 or 子（12月）
}

/**
 * 日干と月支本気の関係から通変星ID(1-10)を算出する
 * 1=比肩, 2=劫財, 3=食神, 4=傷官, 5=偏財, 6=正財, 7=偏官, 8=正官, 9=偏印, 10=印綬
 */
function calcTsuhensei(dayStemIdx: number, targetStemIdx: number): number {
  const dayEl  = STEM_ELEMENT[dayStemIdx]
  const dayPol = STEM_POLARITY[dayStemIdx]
  const tgtEl  = STEM_ELEMENT[targetStemIdx]
  const tgtPol = STEM_POLARITY[targetStemIdx]
  const same   = dayPol === tgtPol

  if (dayEl === tgtEl)                          return same ? 1 : 2  // 比肩 / 劫財
  if ((dayEl + 1) % 5 === tgtEl)               return same ? 3 : 4  // 食神 / 傷官（日干が生じる）
  if (CONTROLS[dayEl] === tgtEl)               return same ? 5 : 6  // 偏財 / 正財（日干が克する）
  if (CONTROLS[tgtEl] === dayEl)               return same ? 7 : 8  // 偏官 / 正官（日干が克される）
  if ((tgtEl + 1) % 5 === dayEl)              return same ? 9 : 10 // 偏印 / 印綬（日干が生じられる）
  return 1
}

/**
 * 生年月日から元命ID(1-10)を算出する
 * 月柱の地支通変星（中心星）を返す
 */
export function calculateGenmeiId(birthDate: string): number {
  const date = new Date(birthDate)
  const zodiacId = calculateZodiacId(birthDate)

  // 日干インデックス (0-9): 甲=0, 乙=1, ... 癸=9
  const dayStemIdx = (zodiacId - 1) % 10

  // 月支インデックス (0-11)
  const monthBranchIdx = getMonthBranchIndex(date)

  // 月支の本気（天干インデックス）
  const targetStemIdx = MONTH_BRANCH_MAIN_STEM[monthBranchIdx]

  return calcTsuhensei(dayStemIdx, targetStemIdx)
}
