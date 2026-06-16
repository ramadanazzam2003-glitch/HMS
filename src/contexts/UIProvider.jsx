import UIContext from './UIContext'
import { useToast } from '../hooks/useToast'
import { useConfirm } from '../hooks/useConfirm'

export function UIProvider({ children }) {
  const { toast, ToastContainer } = useToast()
  const { confirm, ConfirmModal } = useConfirm()

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}
      <ToastContainer />
      <ConfirmModal />
    </UIContext.Provider>
  )
}
