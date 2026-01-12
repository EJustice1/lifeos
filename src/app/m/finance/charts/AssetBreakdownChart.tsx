"use client"

import { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import { getAssetBreakdownData } from '@/lib/actions/finance'

Chart.register(...registerables)

export function AssetBreakdownChart() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<Awaited<ReturnType<typeof getAssetBreakdownData>> | null>(null)
  const [cashPercentage, setCashPercentage] = useState(0)
  const [stocksPercentage, setStocksPercentage] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getAssetBreakdownData()
        renderChart(data)
      } catch (err) {
        setError('Failed to load asset breakdown data')
        console.error('Error fetching asset breakdown:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  const renderChart = (data: Awaited<ReturnType<typeof getAssetBreakdownData>>) => {
    if (!chartRef.current) return

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const totalAssets = data.cash + data.stocks
    const calculatedCashPercentage = totalAssets > 0 ? Math.round((data.cash / totalAssets) * 100) : 0
    const calculatedStocksPercentage = totalAssets > 0 ? Math.round((data.stocks / totalAssets) * 100) : 0

    setChartData(data)
    setCashPercentage(calculatedCashPercentage)
    setStocksPercentage(calculatedStocksPercentage)

    // Generate colors for all assets
    const allLabels = [
      ...Object.keys(data.cashByAccount),
      ...Object.keys(data.stocksBySymbol)
    ]

    const backgroundColors = allLabels.map((label, index) => {
      // Cash accounts get green variations, stocks get blue/purple variations
      const isCashAccount = Object.keys(data.cashByAccount).includes(label)
      if (isCashAccount) {
        const hue = 120 + (index * 5) % 30 // Green variations
        return `hsl(${hue}, 70%, 50%)`
      } else {
        const hue = 220 + (index * 15) % 60 // Blue/purple variations
        return `hsl(${hue}, 70%, 50%)`
      }
    })

    // Combine all data into a single dataset
    const allData = [
      ...Object.values(data.cashByAccount),
      ...Object.values(data.stocksBySymbol)
    ]

    // Don't render chart if there's no data
    if (allData.length === 0 || allData.every(val => val === 0)) {
      setError('No asset data available')
      return
    }

    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: allLabels,
        datasets: [{
          data: allData,
          backgroundColor: backgroundColors,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // We'll use custom legend
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || ''
                const value = context.parsed || 0
                const datasetLabel = context.dataset.label || ''
                return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              },
              afterLabel: (context) => {
                const value = context.parsed || 0
                const percentage = totalAssets > 0 ? Math.round((value / totalAssets) * 100) : 0
                return `${percentage}% of total`
              },
            },
          },
        },
      },
    })
  }

  return (
    <div className="bg-[var(--mobile-card-bg)] rounded-[var(--mobile-border-radius)] p-[var(--mobile-card-padding)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Asset Breakdown</h3>
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
        <div className="flex justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Cash: {isLoading ? '...' : `$${chartData?.cash?.toLocaleString()}`} ({cashPercentage}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Stocks: {isLoading ? '...' : `$${chartData?.stocks?.toLocaleString()}`} ({stocksPercentage}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}