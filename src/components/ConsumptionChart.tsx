import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { MeterReading } from '../types/reading'

interface ConsumptionChartProps {
  readings: MeterReading[]
}

const COLORS: Record<string, string> = {
  דן: '#4f6ef7',
  רוטשילד: '#ef4444',
}

export default function ConsumptionChart({ readings }: ConsumptionChartProps) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthly = readings.filter(r => {
    const d = new Date(r.created_at)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const danTotal = monthly
    .filter(r => r.station === 'dan')
    .reduce((sum, r) => sum + r.reading_kwh, 0)

  const rothschildTotal = monthly
    .filter(r => r.station === 'rothschild')
    .reduce((sum, r) => sum + r.reading_kwh, 0)

  const data = [
    { name: 'דן', value: danTotal },
    { name: 'רוטשילד', value: rothschildTotal },
  ].filter(d => d.value > 0)

  const isEmpty = data.length === 0

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 text-right">
        התפלגות החודש הנוכחי
      </h2>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-8">
          אין נתונים לחודש הנוכחי
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map(entry => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                formatter={value => [
                  `${Number(value ?? 0).toLocaleString()} קוט"ש`,
                  '',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-1 mt-3 text-sm text-right">
            {data.map(entry => (
              <div key={entry.name} className="flex items-center justify-end gap-2">
                <span className="text-gray-600">
                  <span className="font-semibold">{entry.name}</span>{' '}
                  {entry.value.toLocaleString()} קוט&quot;ש
                </span>
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: COLORS[entry.name] }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
