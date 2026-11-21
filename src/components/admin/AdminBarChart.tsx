interface AdminBarChartDatum {
  readonly label: string
  readonly value: number
}

interface AdminBarChartProps {
  readonly data: ReadonlyArray<AdminBarChartDatum>
  readonly height?: number
}

export function AdminBarChart({ data, height = 180 }: AdminBarChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((entry) => entry.value)) : 0
  const safeMaxValue = maxValue > 0 ? maxValue : 1
  const minimumChartWidth = 280
  const chartWidth = Math.max(data.length * 40, minimumChartWidth)
  const slotWidth = data.length > 0 ? chartWidth / data.length : chartWidth
  const barWidth = Math.min(14, slotWidth * 0.55)
  const chartHeight = height
  const labelHeight = 20

  return (
    <div className="max-w-full overflow-x-auto" role="group" aria-label="Gráfico de barras">
      <svg
        width={chartWidth}
        height={chartHeight + labelHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight + labelHeight}`}
        className="block"
        role="img"
        aria-label="Gráfico de barras"
      >
        {data.map((entry, index) => {
          const barHeight = Math.max((entry.value / safeMaxValue) * chartHeight, entry.value > 0 ? 4 : 0)
          const x = index * slotWidth + (slotWidth - barWidth) / 2
          const centerX = index * slotWidth + slotWidth / 2
          const y = chartHeight - barHeight

          return (
            <g key={`${entry.label}-${index}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2}
                className="fill-brand"
              >
                <title>{`${entry.label}: ${entry.value}`}</title>
              </rect>
              <text
                x={centerX}
                y={y - 6}
                textAnchor="middle"
                className="fill-ink-muted text-[9px] font-semibold"
              >
                {entry.value}
              </text>
              <text
                x={centerX}
                y={chartHeight + labelHeight - 4}
                textAnchor="middle"
                className="fill-ink-muted text-[9px] uppercase tracking-[0.08em]"
              >
                {entry.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
