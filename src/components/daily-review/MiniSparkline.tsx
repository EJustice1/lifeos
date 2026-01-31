'use client'

interface MiniSparklineProps {
  data: number[]
  color?: string
  height?: number
}

export function MiniSparkline({ 
  data, 
  color = 'rgb(168, 85, 247)', // Purple by default
  height = 24 
}: MiniSparklineProps) {
  if (data.length === 0) return null

  const max = Math.max(...data, 1) // Avoid division by zero
  const min = Math.min(...data, 0)
  const range = max - min || 1

  // Use viewBox for responsive full-width
  const width = 100
  const padding = 2
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - padding * 2)
    const y = padding + (1 - (value - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const pathData = `M ${points.join(' L ')}`

  // Create area path (for fill)
  const areaPath = `${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="none"
      style={{ minHeight: '24px' }}
    >
      {/* Fill area */}
      <path
        d={areaPath}
        fill={color}
        opacity={0.2}
      />
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End point */}
      <circle
        cx={points[points.length - 1]?.split(',')[0] || width - padding}
        cy={points[points.length - 1]?.split(',')[1] || height / 2}
        r={2}
        fill={color}
      />
    </svg>
  )
}
