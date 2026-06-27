'use server'

export async function testAction(_state: unknown) {
  return { hello: 'world', timestamp: new Date().toISOString() }
}
