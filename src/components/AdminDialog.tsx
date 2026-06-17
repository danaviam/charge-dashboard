interface AdminDialogProps {
  open: boolean
  message: string
  mode: 'confirm' | 'alert'
  confirmLabel?: string
  onConfirm: () => void
  onCancel?: () => void
}

export default function AdminDialog({
  open,
  message,
  mode,
  confirmLabel = 'אישור',
  onConfirm,
  onCancel,
}: AdminDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-3 sm:px-4 pb-[env(safe-area-inset-bottom)]"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg p-5 sm:p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800 text-right mb-3">
          הודעת מנהל
        </h2>
        <p className="text-sm text-gray-700 text-right whitespace-pre-line mb-5">
          {message}
        </p>
        <div className="flex gap-2 justify-end">
          {mode === 'confirm' && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 sm:py-2 text-sm text-gray-600 hover:text-gray-800 min-h-[44px]"
            >
              ביטול
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 sm:py-2 rounded-lg text-sm min-h-[44px]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
