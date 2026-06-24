import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { consumptionTotals } from '../lib/consumption'
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

  const { totalDan: danTotal, totalRothschild: rothschildTotal } = consumptionTotals(
    readings,
    { month: currentMonth, year: currentYear }
  )

  const data = [
    { name: 'דן', value: danTotal },
    { name: 'רוטשילד', value: rothschildTotal },
  ].filter(d => d.value > 0)

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const percentOf = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0

  const isEmpty = data.length === 0

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 text-right">
        התפלגות החודש הנוכחי
      </h2>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-6 sm:py-8">
          אין נתונים לחודש הנוכחי
        </div>
      ) : (
        <>
          <div className="mx-auto w-full max-w-[200px] aspect-square sm:max-w-none sm:aspect-auto sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius="82%"
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map(entry => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                formatter={value =>
                  `${Number(value ?? 0).toLocaleString()} קוט"ש`
                }
              />
            </PieChart>
          </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-1 mt-3 text-sm w-full items-start">
            {data.map(entry => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[entry.name] }}
                />
                <span className="text-gray-600">
                  <span className="font-semibold">{entry.name}</span>{' '}
                  {entry.value.toLocaleString()} קוט&quot;ש ({percentOf(entry.value)}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
