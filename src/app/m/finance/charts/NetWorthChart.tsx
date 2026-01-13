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

// Map time ranges to number of weeks
const TIME_RANGE_WEEKS: Record<TimeRange, number | 'all'> = {
  month: 4,
  quarter: 12,
  year: 52,
  all: 'all',
};

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

        // Fetch all available data (24 months max)
        const [netWorth, history, monthlyStats] = await Promise.all([
          getNetWorth(),
          getNetWorthHistory(24),
          getMonthlyStats(new Date().getFullYear(), new Date().getMonth() + 1)
        ]);

        if (!netWorth) {
          throw new Error('No net worth data available');
        }

        // Determine number of weeks to show based on time range
        const weeksToShow = TIME_RANGE_WEEKS[timeRange];

        // Generate weekly data points
        const weeklyData = [];
        const now = new Date();

        // Create a map of monthly data for quick lookup
        const monthlyDataMap = new Map();
        if (history && history.length > 0) {
          history.forEach(item => {
            const monthKey = item.date.slice(0, 7); // YYYY-MM format
            monthlyDataMap.set(monthKey, item.total_assets);
          });
        }

        // Get the oldest available data date
        const oldestDate = history && history.length > 0
          ? new Date(history[0].date)
          : now;

        // For 'all' time range, calculate weeks from oldest data to now
        let numWeeks: number;
        if (weeksToShow === 'all') {
          const weeksDiff = Math.ceil((now.getTime() - oldestDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          numWeeks = Math.max(weeksDiff, 4); // Minimum 4 weeks
        } else {
          numWeeks = weeksToShow;
        }

        // Generate weekly data points (going back numWeeks from now)
        for (let i = numWeeks - 1; i >= 0; i--) {
          const weekDate = new Date(now);
          weekDate.setDate(now.getDate() - (i * 7));

          // Check if this week is before the oldest available data
          if (weekDate < oldestDate) {
            // Use oldest available data
            const oldestMonthKey = oldestDate.toISOString().slice(0, 7);
            const value = monthlyDataMap.get(oldestMonthKey) || netWorth.total;
            weeklyData.push({
              date: weekDate.toISOString().split('T')[0],
              value: value
            });
          } else {
            // Find the most recent monthly data for this week
            const monthKey = weekDate.toISOString().slice(0, 7); // YYYY-MM

            let value = netWorth.total; // Default to current net worth

            // Look for exact month match or most recent month before this week
            if (monthlyDataMap.has(monthKey)) {
              value = monthlyDataMap.get(monthKey);
            } else {
              // Find the most recent month with data before this week
              let mostRecentValue = null;
              for (const [dataMonthKey, dataValue] of monthlyDataMap.entries()) {
                if (dataMonthKey <= monthKey) {
                  if (!mostRecentValue || dataMonthKey > mostRecentValue.key) {
                    mostRecentValue = { key: dataMonthKey, value: dataValue };
                  }
                }
              }

              if (mostRecentValue) {
                value = mostRecentValue.value;
              }
            }

            weeklyData.push({
              date: weekDate.toISOString().split('T')[0],
              value: value
            });
          }
        }

        setNetWorthData({
          currentNetWorth: netWorth.total,
          monthlyIncome: monthlyStats?.income || 0,
          monthlyExpenses: monthlyStats?.expenses || 0,
          historicalData: weeklyData
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

    // No projections for weekly view - just show historical data
    const allData = [...historical];

    const labels = allData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const data = allData.map(item => item.value);

    // All points are historical
    const historicalPoints = historical.map((_, i) => i);
    const projectedPoints: number[] = [];

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
  }, [netWorthData, timeRange]);

  const timeRangeLabels: Record<TimeRange, string> = {
    month: '1M',
    quarter: '3M',
    year: '1Y',
    all: 'All',
  };

  return (
    <div className="bg-[var(--mobile-card-bg)] rounded-[var(--mobile-border-radius)] p-[var(--mobile-card-padding)]">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Net Worth</h3>
          <div className="flex gap-1">
            {(Object.keys(TIME_RANGE_WEEKS) as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {timeRangeLabels[range]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-zinc-400">
          {timeRange === 'month' && 'Last 4 weeks'}
          {timeRange === 'quarter' && 'Last 12 weeks'}
          {timeRange === 'year' && 'Last 52 weeks'}
          {timeRange === 'all' && 'All time'}
        </p>
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

      <div className="mt-4 text-xs text-zinc-500">
        <p>Weekly resolution showing net worth trend</p>
      </div>
    </div>
  );
}