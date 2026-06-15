import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRole } from '../context/RoleContext'
import type { MeterReading } from '../types/reading'

interface HistoryTableProps {
  readings: MeterReading[]
  onDeleted: () => void
  onUpdated: () => void
}

function computeTotals(readings: MeterReading[]) {
  let totalDan = 0
  let totalRothschild = 0
  for (const r of readings) {
    if (r.station === 'dan') totalDan += r.reading_kwh
    else totalRothschild += r.reading_kwh
  }
  return { totalDan, totalRothschild }
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

export default function HistoryTable({ readings, onDeleted, onUpdated }: HistoryTableProps) {
  const { role } = useRole()
  const isAdmin = role === 'admin'

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const sorted = [...readings].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const { totalDan, totalRothschild } = computeTotals(readings)

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק קריאה זו?')) return
    await supabase.from('meter_readings').delete().eq('id', id)
    onDeleted()
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

  const colCount = isAdmin ? 4 : 3

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
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2 text-sm font-semibold text-gray-700">
      <p className="text-gray-500 font-medium text-xs mb-1">סה&quot;כ</p>
      <div className="flex items-center justify-end gap-2">
        <span>דן: {totalDan.toLocaleString()} קוט&quot;ש</span>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
      </div>
      <div className="flex items-center justify-end gap-2">
        <span>רוטשילד: {totalRothschild.toLocaleString()} קוט&quot;ש</span>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 text-right">
        היסטוריית קריאות
      </h2>

      {readings.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">אין קריאות עדיין</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sorted.map(r => {
              const st = stationLabel[r.station]
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
                  {isAdmin && <th className="pb-3 px-2 font-medium">פעולות</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => {
                  const st = stationLabel[r.station]
                  const isEditing = editingId === r.id
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
                      {isAdmin && (
                        <td className="py-2 px-2">{renderActions(r)}</td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold text-gray-700">
                  <td className="pt-3 pb-1 px-2" colSpan={colCount - 2}>
                    סה&quot;כ
                  </td>
                  <td className="pt-3 pb-1 px-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                      דן: {totalDan.toLocaleString()} קוט&quot;ש
                    </span>
                  </td>
                  {isAdmin && <td />}
                </tr>
                <tr className="bg-gray-50 font-semibold text-gray-700">
                  <td className="pt-1 pb-3 px-2" colSpan={colCount - 2} />
                  <td className="pt-1 pb-3 px-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                      רוטשילד: {totalRothschild.toLocaleString()} קוט&quot;ש
                    </span>
                  </td>
                  {isAdmin && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
