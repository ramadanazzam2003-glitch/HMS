import { useState, useCallback } from 'react'

let confirmId = 0

export function useConfirm() {
  const [confirmState, setConfirmState] = useState(null)

  const confirm = useCallback((message, { title = 'Confirm', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false } = {}) => {
    return new Promise(resolve => {
      setConfirmState({
        id: ++confirmId,
        message,
        title,
        confirmLabel,
        cancelLabel,
        danger,
        resolve,
      })
    })
  }, [])

  const handleConfirm = () => {
    confirmState?.resolve(true)
    setConfirmState(null)
  }

  const handleCancel = () => {
    confirmState?.resolve(false)
    setConfirmState(null)
  }

  const ConfirmModal = () => {
    if (!confirmState) return null
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={handleCancel}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fadeIn"
          onClick={e => e.stopPropagation()}>
          <h3 className="font-bold text-gray-900 text-lg mb-2">{confirmState.title}</h3>
          <p className="text-gray-500 text-sm mb-6">{confirmState.message}</p>
          <div className="flex gap-3 justify-end">
            <button onClick={handleCancel}
              className="btn btn-secondary btn-md">
              {confirmState.cancelLabel}
            </button>
            <button onClick={handleConfirm}
              className={`btn btn-md ${confirmState.danger ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' : 'btn-primary'}`}>
              {confirmState.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return { confirm, ConfirmModal }
}
