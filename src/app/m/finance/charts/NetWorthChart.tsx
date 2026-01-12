"use client";

import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { TimeRange } from '@/lib/types/finance';
import { getNetWorth, getNetWorthHistory, getMonthlyStats } from '@/lib/actions/finance';

Chart.register(...registerables);

interface NetWorthChartProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function NetWorthChart({ timeRange, onTimeRangeChange }: NetWorthChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [netWorthData, setNetWorthData] = useState<{
    currentNetWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    historicalData: { date: string; value: number }[];
  } | null>(null);

  // Calculate future projection
  const calculateProjection = () => {
    if (!netWorthData || netWorthData.historicalData.length === 0) return [];

    const monthlySavings = netWorthData.monthlyIncome - netWorthData.monthlyExpenses;
    const projectionMonths = 12;
    const projectedData = [];

    let currentValue = netWorthData.currentNetWorth;

    // Use current date if no historical data, otherwise use last historical date
    const lastDate = netWorthData.historicalData.length > 0
      ? new Date(netWorthData.historicalData[netWorthData.historicalData.length - 1].date)
      : new Date();

    // Validate that lastDate is a valid date
    if (isNaN(lastDate.getTime())) {
      console.error('Invalid date in net worth data');
      return [];
    }

    for (let i = 1; i <= projectionMonths; i++) {
      const newDate = new Date(lastDate);
      newDate.setMonth(lastDate.getMonth() + i);
      currentValue += monthlySavings;
      projectedData.push({
        date: newDate.toISOString().split('T')[0],
        value: currentValue,
      });
    }

    return projectedData;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Convert time range to months
        const monthsMap: Record<TimeRange, number> = {
          'month': 1,
          'quarter': 3,
          'year': 12,
          'all': 24
        };

        // Fetch data from server actions
        const [netWorth, history, monthlyStats] = await Promise.all([
          getNetWorth(),
          getNetWorthHistory(monthsMap[timeRange]),
          getMonthlyStats(new Date().getFullYear(), new Date().getMonth() + 1)
        ]);

        if (!netWorth || !history) {
          throw new Error('No net worth data available');
        }

        // Prepare data for chart
        const historicalData = history.map(item => ({
          date: item.date,
          value: item.total_assets
        }));

        setNetWorthData({
          currentNetWorth: netWorth.total,
          monthlyIncome: monthlyStats?.income || 0,
          monthlyExpenses: monthlyStats?.expenses || 0,
          historicalData
        });

      } catch (err) {
        setError('Failed to load net worth data');
        console.error('Error fetching net worth data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [timeRange]);

  useEffect(() => {
    if (!chartRef.current || !netWorthData) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const historical = netWorthData.historicalData;
    const projected = calculateProjection();
    const allData = [...historical, ...projected];

    const labels = allData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const data = allData.map(item => item.value);

    // Separate historical and projected data points
    const historicalPoints = historical.map((_, i) => i);
    const projectedPoints = projected.map((_, i) => historical.length + i);

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Historical Net Worth',
            data,
            borderColor: '#10b981', // emerald-500
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
            segment: {
              borderDash: (ctx) => projectedPoints.includes(ctx.p0DataIndex) ? [5, 5] : undefined,
            },
          },
          {
            label: 'Projected Net Worth',
            data: projectedPoints.map(i => data[i]),
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
            borderDash: [5, 5],
            pointStyle: 'triangle',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const isProjection = projectedPoints.includes(context.dataIndex);
                const value = context.parsed.y !== null ? context.parsed.y : 0;
                return `${context.dataset.label}: $${value.toLocaleString()}${isProjection ? ' (projected)' : ''}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value) => `$${value.toLocaleString()}`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [timeRange]);

  return (
    <div className="bg-[var(--mobile-card-bg)] rounded-[var(--mobile-border-radius)] p-[var(--mobile-card-padding)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Net Worth Over Time</h3>
        <div className="flex space-x-2">
          {['month', 'quarter', 'year', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range as TimeRange)}
              className={`px-3 py-1 rounded-full text-sm ${timeRange === range ? 'bg-[var(--mobile-primary)] text-white' : 'bg-zinc-800 text-zinc-300'}`}
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
        <p>📈 <strong>Current Net Worth:</strong> ${netWorthData?.currentNetWorth ? (isNaN(netWorthData.currentNetWorth) ? '0' : netWorthData.currentNetWorth.toLocaleString()) : '...'}</p>
        <p>💰 <strong>Monthly Savings:</strong> ${netWorthData ? (isNaN(netWorthData.monthlyIncome - netWorthData.monthlyExpenses) ? '0' : (netWorthData.monthlyIncome - netWorthData.monthlyExpenses).toLocaleString()) : '...'}</p>
        <p className="text-xs mt-1">Projections based on current monthly savings rate. Dashed line indicates estimated future values.</p>
      </div>
    </div>
  );
}