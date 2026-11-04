export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getDB } = await import('./db/models')
    getDB()
  }
}
