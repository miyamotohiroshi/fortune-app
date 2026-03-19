import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 全60干支のシードを開始します...')

  // 1〜4番（すでにある正式なデータ）
  const officialData = [
    { id: 1, name: '甲子', title: '始まりを告げる、純粋なエネルギー', description: ['頭の回転が速く知性豊か', '向上心が強く独立心旺盛', '世のため人のために動く強い正義感がある'] },
    { id: 2, name: '乙丑', title: '粘り強く形にする、冬の終わりの草花', description: ['温厚でおとなしい穏やかな人', '慎重で堅実派', '大器晩成型'] },
    { id: 3, name: '丙寅', title: '周囲を照らす、昇りたての太陽', description: ['陽気で明るい人気者', '素直で裏表のない性格', 'プライドが高い'] },
    { id: 4, name: '丁卯', title: '静かに燃える、知的な情熱', description: ['人当たりが良く協調性がある', '勘が鋭く頭脳明晰', '熱しやすく冷めやすい'] }
  ]

  // 残りの干支名リスト（5番〜60番）
  const remainingNames = [
    '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
    '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
    '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
    '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
    '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
    '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'
  ]

  // 1. 正式データの登録
  for (const z of officialData) {
    await prisma.zodiac.upsert({
      where: { id: z.id },
      update: z,
      create: z,
    })
  }

  // 2. 仮データの登録（5番以降）
  for (let i = 0; i < remainingNames.length; i++) {
    const id = i + 5
    const name = remainingNames[i]
    await prisma.zodiac.upsert({
      where: { id: id },
      update: {}, // 既存データがある場合は更新しない（または上書きしたい場合はここを記述）
      create: {
        id: id,
        name: name,
        title: `${name}の仮タイトル`,
        description: ['性格の特徴1（準備中）', '性格の特徴2（準備中）', '性格の特徴3（準備中）']
      },
    })
  }

  console.log('✅ 全60干支の登録が完了しました！')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })