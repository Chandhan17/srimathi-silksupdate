import { useContext, useMemo } from 'react'
import ToastContext from '../context/toast-context'

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.')
  }

  return useMemo(
    () => ({
      showToast: context.showToast,
      success: (message) => context.showToast({ type: 'success', message }),
      error: (message) => context.showToast({ type: 'error', message }),
      info: (message) => context.showToast({ type: 'info', message }),
    }),
    [context],
  )
}
