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
  const barWidth = 28
  const gap = 12
  const chartHeight = height
  const width = Math.max(data.length * (barWidth + gap), barWidth)
  const labelHeight = 20

  return (
    <svg
      viewBox={`0 0 ${width} ${chartHeight + labelHeight}`}
      className="w-full"
      role="img"
      aria-label="Gráfico de barras"
    >
      {data.map((entry, index) => {
        const barHeight = Math.max((entry.value / safeMaxValue) * chartHeight, entry.value > 0 ? 4 : 0)
        const x = index * (barWidth + gap) + (barWidth - 14) / 2
        const y = chartHeight - barHeight

        return (
          <g key={`${entry.label}-${index}`}>
            <rect
              x={x}
              y={y}
              width={14}
              height={barHeight}
              rx={2}
              className="fill-brand"
            >
              <title>{`${entry.label}: ${entry.value}`}</title>
            </rect>
            <text
              x={x + 7}
              y={y - 6}
              textAnchor="middle"
              className="fill-ink-muted text-[9px] font-semibold"
            >
              {entry.value}
            </text>
            <text
              x={x + 7}
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
  )
}
