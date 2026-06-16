import { useState, useCallback, useRef } from 'react'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])
  const timerRef = useRef({})

  const removeToast = useCallback((id) => {
    clearTimeout(timerRef.current[id])
    delete timerRef.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, { type = 'info', duration = 3500 } = {}) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    timerRef.current[id] = setTimeout(() => removeToast(id), duration)
    return id
  }, [removeToast])

  const ToastContainer = () => {
    if (toasts.length === 0) return null
    return (
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slideIn max-w-xs ${
              t.type === 'success' ? 'bg-green-600 text-white' :
              t.type === 'error' ? 'bg-red-600 text-white' :
              'bg-gray-800 text-white'
            }`}
            onClick={() => removeToast(t.id)}
          >
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    )
  }

  return { toast, ToastContainer }
}
