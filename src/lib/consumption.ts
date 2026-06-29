import type { MeterReading, Station } from '../types/reading'

function sortByDateAsc(readings: MeterReading[]) {
  return [...readings].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

function isInMonth(iso: string, month: number, year: number) {
  const d = new Date(iso)
  return d.getMonth() === month && d.getFullYear() === year
}

export function stationConsumption(
  readings: MeterReading[],
  station: Station,
  month?: { month: number; year: number }
): number {
  const sorted = sortByDateAsc(readings)
  const diffById = readingDiffById(sorted)
  let atStation = sorted.filter(r => r.station === station)

  if (month) {
    atStation = atStation.filter(r => isInMonth(r.created_at, month.month, month.year))
  }

  return atStation.reduce((sum, row) => sum + (diffById[row.id] ?? 0), 0)
}

export function consumptionTotals(
  readings: MeterReading[],
  month?: { month: number; year: number }
) {
  return {
    totalDan: stationConsumption(readings, 'dan', month),
    totalRothschild: stationConsumption(readings, 'rothschild', month),
  }
}

export function readingDiffById(readings: MeterReading[]): Record<string, number> {
  const sorted = sortByDateAsc(readings)
  const diffs: Record<string, number> = {}
  const lastByStation: Partial<Record<Station, number>> = {}

  sorted.forEach((current) => {
    const prev = lastByStation[current.station]
    diffs[current.id] = prev !== undefined
      ? Math.max(0, Number(current.reading_kwh) - prev)
      : 0
    lastByStation[current.station] = Number(current.reading_kwh)
  })

  return diffs
}
