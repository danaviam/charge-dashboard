import type { MeterReading } from '../types/reading'
import { supabase } from './supabase'

export function filterVisibleReadings(readings: MeterReading[]): MeterReading[] {
  return readings.filter(r => !r.hidden)
}

export async function hideReadings(ids: string[]): Promise<{ error: string | null }> {
  if (ids.length === 0) return { error: null }
  const { error } = await supabase
    .from('meter_readings')
    .update({ hidden: true })
    .in('id', ids)
  return { error: error ? error.message : null }
}
