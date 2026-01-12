"use client";

import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { getMonthlyStats } from '@/lib/actions/finance';

Chart.register(...registerables);

export function DistributionChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current date for monthly stats
        const now = new Date();
        const data = await getMonthlyStats(now.getFullYear(), now.getMonth() + 1);

        if (!data) {
          throw new Error('No spending data available');
        }

        // Prepare chart data from real spending categories
        const labels = Object.keys(data.byCategory);
        const values = Object.values(data.byCategory);

        renderChart(labels, values);
      } catch (err) {
        setError('Failed to load spending distribution');
        console.error('Error fetching spending data:', err);
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
  }, []);

  const renderChart = (labels: string[], values: number[]) => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Generate colors for categories
    const backgroundColors = labels.map((_, index) => {
      const hue = (index * 60) % 360;
      return `hsla(${hue}, 70%, 50%, 0.7)`;
    });

    const borderColors = labels.map((_, index) => {
      const hue = (index * 60) % 360;
      return `hsla(${hue}, 70%, 50%, 1)`;
    });

    const chartData = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      }],
    };

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#ffffff',
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = values.reduce((sum: number, value: number) => sum + value, 0);
                const percentage = total > 0 ? ((context.parsed as number) / total * 100).toFixed(1) : '0.0';
                return `${context.label}: $${(context.parsed as number).toLocaleString()} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  };

  return (
    <div className="bg-[var(--mobile-card-bg)] rounded-[var(--mobile-border-radius)] p-[var(--mobile-card-padding)]">
      <h3 className="text-lg font-semibold mb-4">Spending Distribution</h3>
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
    </div>
  );
}