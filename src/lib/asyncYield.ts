/**
 * イベントループに一度制御を返す。重いCPU計算の直前でawaitすることで、
 * ストリーミングSSR時に先に確定したチャンク（性格占断など）を先にクライアントへ
 * flushさせてから、このコンポーネントの計算を開始できるようにする。
 */
export function yieldToClient(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}
