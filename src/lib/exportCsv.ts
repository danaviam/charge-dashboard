import type { MeterReading } from '../types/reading'

const stationName: Record<string, string> = {
  dan: 'דן',
  rothschild: 'רוטשילד',
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function csvCell(value: string | number): string {
  const s = String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Builds a CSV of the given readings, in the order given (matches the on-screen table). */
export function buildHistoryCsv(
  rows: MeterReading[],
  diffById: Record<string, number>
): string {
  const lines: (string | number)[][] = [
    ['תאריך', 'עמדה', 'קריאה (קוט"ש)', 'הפרש (קוט"ש)'],
    ...rows.map(r => [
      csvDate(r.created_at),
      stationName[r.station] ?? r.station,
      Number(r.reading_kwh),
      diffById[r.id] ?? 0,
    ]),
  ]
  return lines.map(l => l.map(csvCell).join(',')).join('\r\n')
}

export function downloadHistoryCsv(
  rows: MeterReading[],
  diffById: Record<string, number>
) {
  const now = new Date()
  const filename = `charge-history-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`
  // BOM so Excel detects UTF-8 and shows Hebrew correctly.
  const blob = new Blob(['﻿', buildHistoryCsv(rows, diffById)], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
