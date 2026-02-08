'use client'

import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  }

  const styles = {
    success: 'from-green-500/90 to-green-600/90 border-green-400/50',
    error: 'from-red-500/90 to-red-600/90 border-red-400/50',
    info: 'from-blue-500/90 to-blue-600/90 border-blue-400/50',
    warning: 'from-yellow-500/90 to-yellow-600/90 border-yellow-400/50'
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-down">
      <div className={`bg-gradient-to-r ${styles[type]} backdrop-blur-md border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icons[type]}</span>
          <p className="text-white font-medium flex-1">{message}</p>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}