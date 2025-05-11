

export const ping = async (baseURL?: string) => {
  const now = performance.now()
  const resp = await fetch(`${baseURL}/ping`, { method: 'GET' })
  await resp.text()
  const time = performance.now() - now
  return time
}
