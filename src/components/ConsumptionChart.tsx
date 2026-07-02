import { useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { toPng } from 'html-to-image'
import { consumptionTotals, readingDiffById } from '../lib/consumption'
import { useRole } from '../context/RoleContext'
import type { MeterReading } from '../types/reading'

interface ConsumptionChartProps {
  readings: MeterReading[]
  allReadings: MeterReading[]
}

const COLORS: Record<string, string> = {
  דן: '#4f6ef7',
  רוטשילד: '#ef4444',
}

export default function ConsumptionChart({ readings, allReadings }: ConsumptionChartProps) {
  const { role } = useRole()
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const diffById = readingDiffById(allReadings)
  const { totalDan: danTotal, totalRothschild: rothschildTotal } = consumptionTotals(
    diffById,
    readings
  )

  const data = [
    { name: 'דן', value: danTotal },
    { name: 'רוטשילד', value: rothschildTotal },
  ].filter(d => d.value > 0)

  const total = data.reduce((sum, d) => sum + d.value, 0)

  const isEmpty = data.length === 0

  const cardRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!cardRef.current) return
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: node =>
        !(node instanceof HTMLElement && node.dataset.html2imageIgnore === 'true'),
    })
    const link = document.createElement('a')
    link.download = `consumption-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <div ref={cardRef} className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4" dir="rtl">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 text-right">
          התפלגות צריכה
        </h2>
        {!isEmpty && role === 'admin' && (
          <button
            type="button"
            onClick={handleDownload}
            data-html2image-ignore="true"
            title="הורד כתמונה"
            aria-label="הורד כתמונה"
            className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>PNG</span>
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-6 sm:py-8">
          אין נתונים להצגה
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
                label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                  const RADIAN = Math.PI / 180
                  const angle = midAngle ?? 0
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
                  const x = cx + radius * Math.cos(-angle * RADIAN)
                  const y = cy + radius * Math.sin(-angle * RADIAN)
                  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13}
                      fontWeight="bold"

                    >
                      {pct}%
                    </text>
                  )
                }}
                labelLine={false}
              >
                {data.map(entry => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const kwh = Number(value ?? 0)
                  const pct = total > 0 ? ((kwh / total) * 100).toFixed(1) : '0.0'
                  return [`(${pct}%) ${kwh.toLocaleString()} קוט"ש`, name]
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-1 mt-3 text-sm w-full" dir="rtl">
            <div className="flex justify-between items-center font-semibold text-gray-800 border-b border-gray-100 pb-1 mb-1">
              <span>סה&quot;כ</span>
              <span>{total.toLocaleString()} קוט&quot;ש</span>
            </div>
            {data.map(entry => (
              <div key={entry.name} className="flex justify-between items-center text-gray-600">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[entry.name] }}
                  />
                  <span className="font-medium">{entry.name}</span>
                </div>
                <span className="flex items-center gap-1">
                  <span className="font-bold text-gray-800">
                    {total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0'}%
                  </span>
                  <span className="text-gray-400">
                    ({entry.value.toLocaleString()} קוט&quot;ש)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
