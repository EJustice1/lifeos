'use client'

import { useEffect, useState, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { getExercisePerformanceHistory } from '@/lib/actions/gym'

interface ExercisePerformanceChartProps {
  exerciseId: number
  exerciseName: string
}

export function ExercisePerformanceChart({ exerciseId, exerciseName }: ExercisePerformanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    Chart.register(...registerables)
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const history = await getExercisePerformanceHistory(exerciseId, 90)
      setData(history)
      setLoading(false)
    }
    loadData()
  }, [exerciseId])

  useEffect(() => {
    if (!chartRef.current || loading || data.length === 0) return

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const dates = data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    const est1RMs = data.map(d => d.estimated_1rm)
    const volumes = data.map(d => d.total_volume)

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Estimated 1RM (lbs)',
            data: est1RMs,
            borderColor: 'rgba(168, 85, 247, 1)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            yAxisID: 'y1',
            tension: 0.3
          },
          {
            label: 'Total Volume (lbs)',
            data: volumes,
            borderColor: 'rgba(34, 197, 94, 1)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            yAxisID: 'y2',
            type: 'bar',
            barThickness: 10
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'white',
              font: { size: 10 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white'
          }
        },
        scales: {
          x: {
            ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 9 } },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y1: {
            type: 'linear',
            position: 'left',
            ticks: { color: 'rgba(168, 85, 247, 1)', font: { size: 9 } },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y2: {
            type: 'linear',
            position: 'right',
            ticks: { color: 'rgba(34, 197, 94, 1)', font: { size: 9 } },
            grid: { display: false }
          }
        }
      }
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        <p>Log more workouts to see progress</p>
      </div>
    )
  }

  if (data.length < 3) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-center px-4">
        <p>Log at least 3 workouts with this exercise for trend analysis</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{exerciseName} Progress (Last 90 Days)</h3>
      <div className="h-64">
        <canvas ref={chartRef} />
      </div>
    </div>
  )
}
