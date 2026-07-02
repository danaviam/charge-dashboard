import { useMemo, useState } from 'react'
import AdminDialog from './AdminDialog'
import { consumptionTotals, readingDiffById } from '../lib/consumption'
import { captureLastBaselineFromReadings, setLastBaseline } from '../lib/baseline'
import { hideReadingIds } from '../lib/hiddenReadings'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import type { MeterReading } from '../types/reading'

interface HistoryTableProps {
  readings: MeterReading[]
  allReadings: MeterReading[]
  onDeleted: () => void
  onUpdated: () => void
  onHistoryHidden: () => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year}, ${hours}:${mins}`
}

const stationLabel: Record<string, { label: string; className: string }> = {
  dan: { label: 'דן', className: 'bg-blue-100 text-blue-700' },
  rothschild: { label: 'רוטשילד', className: 'bg-red-100 text-red-700' },
}

export default function HistoryTable({ readings, allReadings, onDeleted, onUpdated, onHistoryHidden }: HistoryTableProps) {
  const { role } = useRole()
  const isAdmin = role === 'admin'

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingHistory, setDeletingHistory] = useState(false)
  const [dialog, setDialog] = useState<{
    message: string
    mode: 'confirm' | 'alert'
    confirmLabel?: string
    onConfirm: () => void
  } | null>(null)

  const closeDialog = () => setDialog(null)

  const sorted = useMemo(
    () =>
      [...readings].sort(
        (a, b) =>
          Number(b.reading_kwh) - Number(a.reading_kwh) ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [readings]
  )
  const diffById = useMemo(() => readingDiffById(allReadings), [allReadings])

  const historyCleared = allReadings.length > readings.length
  const now = new Date()
  const { totalDan, totalRothschild } = historyCleared
    ? consumptionTotals(allReadings, { month: now.getMonth(), year: now.getFullYear() })
    : consumptionTotals(allReadings)
  const totalAll = totalDan + totalRothschild

  const handleDelete = (id: string) => {
    setDialog({
      message: 'למחוק קריאה זו?',
      mode: 'confirm',
      confirmLabel: 'מחק',
      onConfirm: async () => {
        closeDialog()
        await supabase.from('meter_readings').delete().eq('id', id)
        onDeleted()
      },
    })
  }

  const handleClearHistory = () => {
    const idsToHide = readings.map(r => r.id)
    const capturedBaseline = captureLastBaselineFromReadings(readings)
    if (idsToHide.length === 0) {
      setDialog({
        message: 'אין קריאות למחיקה',
        mode: 'alert',
        onConfirm: closeDialog,
      })
      return
    }

    const message =
      `להסתיר ${idsToHide.length} קריאות מההיסטוריה?\n\n` +
      'הקריאה האחרונה תישמר לצורך חישובים עתידיים (קודמת).'

    setDialog({
      message,
      mode: 'confirm',
      confirmLabel: 'מחק היסטוריה',
      onConfirm: () => {
        closeDialog()
        setLastBaseline(capturedBaseline)
        setDeletingHistory(true)
        hideReadingIds(idsToHide)
        setDeletingHistory(false)
        onHistoryHidden()
      },
    })
  }

  const startEdit = (r: MeterReading) => {
    setEditingId(r.id)
    setEditValue(String(r.reading_kwh))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const saveEdit = async (id: string) => {
    const value = parseInt(editValue, 10)
    if (isNaN(value) || value < 0) return
    setSaving(true)
    await supabase.from('meter_readings').update({ reading_kwh: value }).eq('id', id)
    setSaving(false)
    setEditingId(null)
    setEditValue('')
    onUpdated()
  }

  const colCount = isAdmin ? 5 : 4

  const renderActions = (r: MeterReading) => {
    const isEditing = editingId === r.id
    if (!isAdmin) return null

    if (isEditing) {
      return (
        <span className="inline-flex gap-3">
          <button
            onClick={() => saveEdit(r.id)}
            disabled={saving}
            title="שמור"
            className="text-green-600 hover:text-green-800 transition-colors text-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ✓
          </button>
          <button
            onClick={cancelEdit}
            title="בטל"
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </span>
      )
    }

    return (
      <span className="inline-flex gap-1">
        <button
          onClick={() => startEdit(r)}
          title="ערוך קריאה"
          className="text-indigo-400 hover:text-indigo-600 transition-colors text-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          ✏️
        </button>
        <button
          onClick={() => handleDelete(r.id)}
          title="מחק קריאה"
          className="text-red-400 hover:text-red-600 transition-colors text-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          🗑
        </button>
      </span>
    )
  }

  const renderReadingValue = (r: MeterReading) => {
    const isEditing = editingId === r.id
    if (isEditing) {
      return (
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          pattern="[0-9]*"
          value={editValue}
          onChange={e => setEditValue(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => {
            if (e.key === 'Enter') saveEdit(r.id)
            if (e.key === 'Escape') cancelEdit()
          }}
          autoFocus
          className="w-full max-w-[140px] border border-indigo-400 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      )
    }
    return (
      <span className="font-semibold text-gray-800 text-lg sm:text-sm">
        {r.reading_kwh.toLocaleString()} קוט&quot;ש
      </span>
    )
  }

  const summaryBlock = (
    <div className="flex flex-col gap-1 mt-3 text-sm w-full" dir="rtl">
      <div className="flex justify-between items-center font-semibold text-gray-800 border-b border-gray-100 pb-1 mb-1">
        <span>סה&quot;כ</span>
        <span>{totalAll.toLocaleString()} קוט&quot;ש</span>
      </div>
      <div className="flex justify-between items-center text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0 bg-blue-500" />
          <span className="font-medium">דן</span>
        </div>
        <span>{totalDan.toLocaleString()} קוט&quot;ש</span>
      </div>
      <div className="flex justify-between items-center text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0 bg-red-500" />
          <span className="font-medium">רוטשילד</span>
        </div>
        <span>{totalRothschild.toLocaleString()} קוט&quot;ש</span>
      </div>
    </div>
  )

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 text-right">
          היסטוריית קריאות
        </h2>
        {isAdmin && readings.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={deletingHistory}
            title="הסתר את כל ההיסטוריה מהתצוגה; הקריאה האחרונה תישמר בקודמת"
            className="shrink-0 text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg px-3 py-2 disabled:opacity-50 transition-colors min-h-[44px] sm:min-h-0"
          >
            {deletingHistory ? 'מוחק...' : 'מחק היסטוריה'}
          </button>
        )}
      </div>

      {readings.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">אין קריאות עדיין</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sorted.map(r => {
              const st = stationLabel[r.station]
              const readingDiff = diffById[r.id] ?? 0
              return (
                <div
                  key={r.id}
                  className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${st.className}`}
                    >
                      {st.label}
                    </span>
                    <span className="text-xs text-gray-500 text-left">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    {renderReadingValue(r)}
                    {renderActions(r)}
                  </div>
                  <p className="mt-2 text-sm text-indigo-700 font-medium">
                    הפרש: {readingDiff.toLocaleString()} קוט&quot;ש
                  </p>
                </div>
              )
            })}
            {summaryBlock}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="pb-3 px-2 font-medium">תאריך</th>
                  <th className="pb-3 px-2 font-medium">עמדה</th>
                  <th className="pb-3 px-2 font-medium">קריאה (קוט&quot;ש)</th>
                  <th className="pb-3 px-2 font-medium">הפרש (קוט&quot;ש)</th>
                  {isAdmin && <th className="pb-3 px-2 font-medium">פעולות</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => {
                  const st = stationLabel[r.station]
                  const isEditing = editingId === r.id
                  const readingDiff = diffById[r.id] ?? 0
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-100 ${idx % 2 === 0 ? '' : 'bg-gray-50'}`}
                    >
                      <td className="py-3 px-2 text-gray-600 whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-semibold text-gray-800">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit(r.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            autoFocus
                            className="w-28 border border-indigo-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        ) : (
                          r.reading_kwh.toLocaleString()
                        )}
                      </td>
                      <td className="py-2 px-2 font-semibold text-indigo-700">
                        {readingDiff.toLocaleString()}
                      </td>
                      {isAdmin && (
                        <td className="py-2 px-2">{renderActions(r)}</td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={colCount} className="pt-2 pb-1 px-2">
                    <div className="flex flex-col gap-1 text-sm w-full" dir="rtl">
                      <div className="flex justify-between items-center font-semibold text-gray-800 border-b border-gray-100 pb-1 mb-1">
                        <span>סה&quot;כ</span>
                        <span>{totalAll.toLocaleString()} קוט&quot;ש</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0 bg-blue-500" />
                          <span className="font-medium">דן</span>
                        </div>
                        <span>{totalDan.toLocaleString()} קוט&quot;ש</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0 bg-red-500" />
                          <span className="font-medium">רוטשילד</span>
                        </div>
                        <span>{totalRothschild.toLocaleString()} קוט&quot;ש</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
      </div>

      <AdminDialog
        open={dialog !== null}
        message={dialog?.message ?? ''}
        mode={dialog?.mode ?? 'alert'}
        confirmLabel={dialog?.confirmLabel}
        onConfirm={dialog?.onConfirm ?? closeDialog}
        onCancel={closeDialog}
      />
    </>
  )
}
