const HIRO_WS = 'wss://api.mainnet.hiro.so'

export function createStacksWebSocket(
  onMessage: (data: any) => void,
  onError?: (err: Event) => void
): WebSocket {
  const ws = new WebSocket(`${HIRO_WS}/extended/v1/ws`)
  ws.onmessage = e => { try { onMessage(JSON.parse(e.data) ) } catch {} }
  ws.onerror   = onError || console.error
  return ws
}

export function subscribeToAddress(ws: WebSocket, address: string) {
  ws.send(JSON.stringify({ method: 'address_tx_update', params: { address } }))
}

export function subscribeToBlocks(ws: WebSocket) {
  ws.send(JSON.stringify({ method: 'block', params: {} }))
}
