'use client'

import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { MUSCLE_GROUPS } from '@/lib/gym-utils'

interface MuscleGroupRadarChartProps {
  percentiles: Record<string, number>
}

export function MuscleGroupRadarChart({ percentiles }: MuscleGroupRadarChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const isRegistered = useRef(false)
  const lastDataHash = useRef<string>('')

  // Register Chart.js components once
  useEffect(() => {
    if (!isRegistered.current) {
      Chart.register(...registerables)
      isRegistered.current = true
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!chartRef.current || !percentiles) {
      console.log('Radar chart: Missing ref or percentiles')
      return
    }

    // Create a hash of the data to detect actual changes
    const dataHash = MUSCLE_GROUPS.map(mg => `${mg}:${percentiles[mg] || 0}`).join('|')
    
    // Skip render if data hasn't actually changed AND we've already rendered once
    if (chartInstance.current && dataHash === lastDataHash.current) {
      console.log('Radar chart: Skipping render, data unchanged')
      return
    }

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) {
      console.log('Radar chart: No context available')
      return
    }

    // Destroy previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy()
      chartInstance.current = null
    }

    // Update hash
    lastDataHash.current = dataHash

    // Prepare chart data
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
    const labels = MUSCLE_GROUPS.map(capitalize)
    const data = MUSCLE_GROUPS.map(mg => percentiles[mg] || 0)

    console.log('Rendering radar chart with data:', { labels, data })

    // Color code based on percentile thresholds
    const getColor = (value: number) => {
      if (value >= 80) return 'rgba(34, 197, 94, 0.7)' // Green
      if (value >= 50) return 'rgba(234, 179, 8, 0.7)' // Yellow
      return 'rgba(239, 68, 68, 0.7)' // Red
    }

    // Use dynamic colors for each point
    const pointBackgroundColors = data.map(getColor)
    const borderColor = 'rgba(168, 85, 247, 1)' // Purple

    chartInstance.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Training Volume (%)',
          data,
          backgroundColor: 'rgba(168, 85, 247, 0.2)',
          borderColor,
          borderWidth: 2,
          pointBackgroundColor: pointBackgroundColors,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: borderColor,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            beginAtZero: true,
            angleLines: {
              color: 'rgba(255, 255, 255, 0.2)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            pointLabels: {
              color: 'white',
              font: {
                size: 11
              }
            },
            ticks: {
              display: true,
              stepSize: 25,
              color: 'rgba(255, 255, 255, 0.5)',
              font: {
                size: 9
              },
              backdropColor: 'transparent'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.raw
                let status = 'Under-trained'
                if (value >= 80) status = 'Optimal'
                else if (value >= 50) status = 'Moderate'
                return `${value}% of target (${status})`
              }
            }
          }
        }
      }
    })

    console.log('Radar chart created successfully')
  }, [percentiles])

  if (!percentiles) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        <p>No muscle group data available</p>
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1">
        <canvas ref={chartRef} />
      </div>
      <div className="mt-4 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-zinc-400">80-100%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-zinc-400">50-79%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-zinc-400">0-49%</span>
        </div>
      </div>
    </div>
  )
}
