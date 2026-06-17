import type { MeterReading, Station } from '../types/reading'
import { getLastBaseline } from './baseline'

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
  let atStation = sorted.filter(r => r.station === station)

  if (month) {
    atStation = atStation.filter(r => isInMonth(r.created_at, month.month, month.year))
  }

  if (atStation.length === 0) return 0

  const first = atStation[0]
  const last = atStation[atStation.length - 1]

  if (atStation.length === 1) {
    const globalIdx = sorted.findIndex(r => r.id === first.id)
    const previous =
      globalIdx > 0
        ? Number(sorted[globalIdx - 1].reading_kwh)
        : (getLastBaseline()?.reading_kwh ?? 0)
    return Math.max(0, Number(last.reading_kwh) - previous)
  }

  return Math.max(0, Number(last.reading_kwh) - Number(first.reading_kwh))
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
