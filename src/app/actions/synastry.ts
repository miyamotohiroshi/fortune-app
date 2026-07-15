'use server'

import { synastryFromBirth } from '@/src/lib/astrology/synastry-server'
import type { BirthInput } from '@/src/lib/astrology/synastry-server'
import type { SynResult } from '@/src/lib/astrology/synastry'

// 注意: 'use server' ファイルは async 関数のみを export できる。
// 型の再export（export type ...）は Next.js のサーバー関数変換で実行時エラーになるため置かない。

/** 自分と相手の生年月日から相性（シナストリー）を算出する */
export async function runSynastry(self: BirthInput, partner: BirthInput): Promise<SynResult> {
  return synastryFromBirth(self, partner)
}
