export const ping = async (baseURL?: string) => {
  const now = performance.now()
  const resp = await fetch(`${baseURL}/ping`, { method: 'GET' })
  await resp.text()
  const time = performance.now() - now
  return time
}
// WebSocket连接复用
const activeConnections = new Map<string, WebSocket>()

export const pingws = async (baseURL?: string) => {
  if (!baseURL) return Infinity

  const wsProtocol = baseURL.startsWith('https://') ? 'wss://' : 'ws://'
  const wsURL = baseURL.replace(/^https?:\/\//, wsProtocol) + '/ping/ws'
  
  return new Promise<number>((resolve) => {
    // 检查是否有活跃连接
    let socket = activeConnections.get(wsURL)
    
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      // 创建新连接
      socket = new WebSocket(wsURL)
      activeConnections.set(wsURL, socket)
      
      socket.onopen = () => {
        const startTime = performance.now()
        socket?.send('ping')
        
        const onMessage = (event: MessageEvent) => {
          if (event.data === 'pong') {
            const time = performance.now() - startTime
            socket?.removeEventListener('message', onMessage)
            resolve(time)
          }
        }

        const onError = () => {
          socket?.removeEventListener('message', onMessage)
          socket?.removeEventListener('error', onError)
          activeConnections.delete(wsURL)
          resolve(Infinity)
        }

        socket?.addEventListener('message', onMessage)
        socket?.addEventListener('error', onError)

        // 设置超时
        setTimeout(() => {
          socket?.removeEventListener('message', onMessage)
          socket?.removeEventListener('error', onError)
          resolve(Infinity)
        }, 10000)
      }
      
      socket.onclose = () => {
        activeConnections.delete(wsURL)
      }
      
      socket.onerror = () => {
        activeConnections.delete(wsURL)
        resolve(Infinity)
      }
    } else {
      // 复用现有连接 - 此时连接已建立，可以准确计时
      const startTime = performance.now()
      socket.send('ping')
      
      const onMessage = (event: MessageEvent) => {
        if (event.data === 'pong') {
          const time = performance.now() - startTime
          socket?.removeEventListener('message', onMessage)
          resolve(time)
        }
      }

      const onError = () => {
        socket?.removeEventListener('message', onMessage)
        socket?.removeEventListener('error', onError)
        activeConnections.delete(wsURL)
        resolve(Infinity)
      }

      socket?.addEventListener('message', onMessage)
      socket?.addEventListener('error', onError)

      // 设置超时
      setTimeout(() => {
        socket?.removeEventListener('message', onMessage)
        socket?.removeEventListener('error', onError)
        resolve(Infinity)
      }, 10000)
    }
  })
}
