import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

let confirmId = 0

export function useConfirm() {
  const [confirmState, setConfirmState] = useState(null)
  const { t, isRTL, dir } = useLanguage()

  const confirm = useCallback((message, { title, confirmLabel, cancelLabel, danger = false } = {}) => {
    return new Promise(resolve => {
      setConfirmState({
        id: ++confirmId,
        message,
        title: title || (danger ? (isRTL ? 'تأكيد الحذف' : 'Confirm Delete') : (isRTL ? 'تأكيد' : 'Confirm')),
        confirmLabel: confirmLabel || (danger ? (isRTL ? 'حذف' : 'Delete') : (isRTL ? 'تأكيد' : 'Confirm')),
        cancelLabel: cancelLabel || (isRTL ? 'إلغاء' : 'Cancel'),
        danger,
        resolve,
      })
    })
  }, [isRTL])

  const handleConfirm = () => {
    confirmState?.resolve(true)
    setConfirmState(null)
  }

  const handleCancel = () => {
    confirmState?.resolve(false)
    setConfirmState(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleCancel()
  }

  const ConfirmModal = () => {
    return (
      <AnimatePresence>
        {confirmState && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onKeyDown={handleKeyDown}
            dir={dir}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
              className="relative w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                {/* Top accent bar */}
                <div className={`h-1.5 w-full ${confirmState.danger ? 'bg-red-500' : 'bg-primary'}`} />

                <div className="p-6">
                  {/* Close button */}
                  <button
                    onClick={handleCancel}
                    className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-surface-hover transition-colors`}
                  >
                    <X size={18} />
                  </button>

                  {/* Icon + Content */}
                  <div className={`flex ${isRTL ? 'flex-row' : 'flex-row'} gap-4 ${isRTL ? 'text-end' : 'text-start'}`}>
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      confirmState.danger
                        ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                        : 'bg-primary-light dark:bg-primary/20 text-primary'
                    }`}>
                      {confirmState.danger ? <AlertTriangle size={24} /> : <Info size={24} />}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-txt-primary">
                        {confirmState.title}
                      </h3>
                      <p className="text-sm text-txt-secondary mt-1.5 leading-relaxed">
                        {confirmState.message}
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className={`flex gap-3 mt-6 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                    <button
                      onClick={handleConfirm}
                      className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                        confirmState.danger
                          ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/25'
                          : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25'
                      }`}
                    >
                      {confirmState.confirmLabel}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 h-11 rounded-xl text-sm font-semibold text-txt-primary bg-surface-hover hover:bg-border transition-all duration-200 active:scale-[0.98]"
                    >
                      {confirmState.cancelLabel}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return { confirm, ConfirmModal }
}
