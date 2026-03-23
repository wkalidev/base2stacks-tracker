export interface Notification {
  id:      string
  type:    'success' | 'error' | 'info' | 'warning'
  message: string
  txId?:   string
}

export function createNotification(
  type: Notification['type'],
  message: string,
  txId?: string
): Notification {
  return { id: Math.random().toString(36).slice(2), type, message, txId }
}

export function successNotif(message: string, txId?: string): Notification {
  return createNotification('success', message, txId)
}

export function errorNotif(message: string): Notification {
  return createNotification('error', message)
}
