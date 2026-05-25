import { useMemo, useState } from 'react'
import ToastContext from './toast-context'

const TOAST_DURATION = 3500

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const showToast = ({ type = 'info', message }) => {
    if (!message) return

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, type, message }])

    window.setTimeout(() => {
      removeToast(id)
    }, TOAST_DURATION)
  }

  const value = useMemo(
    () => ({
      showToast,
      removeToast,
    }),
    [],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const variantClass =
            toast.type === 'error'
              ? 'border-red-300 bg-red-50 text-red-700'
              : toast.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-brand-gold/40 bg-white text-brand-maroon'

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-soft ${variantClass}`}
              role="status"
            >
              {toast.message}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
