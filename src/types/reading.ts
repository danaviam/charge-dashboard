export type Station = 'dan' | 'rothschild'

export interface MeterReading {
  id: string
  created_at: string
  station: Station
  reading_kwh: number
}

