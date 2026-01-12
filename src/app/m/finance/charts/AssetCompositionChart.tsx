"use client"

import { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import { getAssetCompositionHistory } from '@/lib/actions/finance'

Chart.register(...registerables)

interface AssetCompositionChartProps {
  timeRange: 'month' | 'quarter' | 'year' | 'all'
  onTimeRangeChange: (range: 'month' | 'quarter' | 'year' | 'all') => void
}

export function AssetCompositionChart({ timeRange, onTimeRangeChange }: AssetCompositionChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Convert time range to months
        const monthsMap: Record<typeof timeRange, number> = {
          'month': 1,
          'quarter': 3,
          'year': 12,
          'all': 24 // Max 2 years for performance
        }

        const data = await getAssetCompositionHistory(monthsMap[timeRange])
        renderChart(data)
      } catch (err) {
        setError('Failed to load asset composition data')
        console.error('Error fetching asset composition:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  const renderChart = (data: Awaited<ReturnType<typeof getAssetCompositionHistory>>) => {
    if (!chartRef.current) return

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const labels = data.map(item =>
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    )

    const cashData = data.map(item => item.cash)
    const stockData = data.map(item => item.stocks)

    // Calculate stacked values (cash + stocks)
    const stackedCashData = cashData.map((value, index) => value)
    const stackedStockData = stockData.map((value, index) => cashData[index] + value)

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Cash',
            data: stackedCashData,
            borderColor: '#10b981', // emerald-600 (mobile-primary)
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
            fill: true,
          },
          {
            label: 'Stocks',
            data: stackedStockData,
            borderColor: '#3b82f6', // blue-600 (mobile-secondary)
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6',
            fill: true,
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const datasetIndex = context.datasetIndex
                const dataIndex = context.dataIndex
                const rawData = data[dataIndex]

                if (datasetIndex === 0) {
                  return `Cash: $${rawData.cash.toLocaleString()}`
                } else {
                  return `Stocks: $${rawData.stocks.toLocaleString()}`
                }
              },
              afterLabel: (context) => {
                const dataIndex = context.dataIndex
                const rawData = data[dataIndex]
                return `Total: $${(rawData.cash + rawData.stocks).toLocaleString()}`
              }
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            stacked: false, // We're manually stacking
            ticks: {
              callback: (value) => `$${value.toLocaleString()}`,
            },
          },
        },
      },
    })
  }

  return (
    <div className="bg-[var(--mobile-card-bg)] rounded-[var(--mobile-border-radius)] p-[var(--mobile-card-padding)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Asset Composition Over Time</h3>
        <div className="flex space-x-2">
          {['month', 'quarter', 'year', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range as 'month' | 'quarter' | 'year' | 'all')}
              disabled={isLoading}
              className={`px-3 py-1 rounded-full text-sm ${timeRange === range ? 'bg-[var(--mobile-primary)] text-white' : 'bg-zinc-800 text-zinc-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--mobile-primary)]"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            {error}
          </div>
        ) : (
          <canvas ref={chartRef} />
        )}
      </div>

      <div className="mt-4 text-sm text-zinc-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--mobile-primary)]"></div>
            <span>Cash</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--mobile-secondary)]"></div>
            <span>Stocks</span>
          </div>
        </div>
      </div>
    </div>
  )
}