import React, { useRef, useEffect } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';

interface Token {
  name: string;
  portfolio_percentage: number;
}

interface TokenDistributionChartProps {
  tokenBalances: Token[];
}

const TokenDistributionChart: React.FC<TokenDistributionChartProps> = ({ tokenBalances }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // Destroy the existing chart instance to avoid duplicates
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    // Group data into tokens and "Other"
    const groupedData = tokenBalances.reduce(
      (acc, token) => {
        const percentage = token.portfolio_percentage;
        if (percentage < 1) {
          acc.other.value += percentage;
        } else {
          acc.tokens.push({ label: token.name, value: percentage });
        }
        return acc;
      },
      { tokens: [] as { label: string; value: number }[], other: { label: 'Other', value: 0 } }
    );

    const chartData = [
      ...groupedData.tokens,
      groupedData.other.value > 0 && groupedData.other, // Include "Other" only if it has a value
    ].filter(Boolean) as { label: string; value: number }[];

    const labels = chartData.map((item) => item.label);
    const data = chartData.map((item) => item.value);

    // Define chart configuration
    const chartConfig: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            label: 'Portfolio Distribution (%)',
            data,
            backgroundColor: [
              '#0D6EFD', '#0BC18D', '#7A3FE4', '#F2C537', '#FF13B4',
              '#E84141', '#F6931A', '#009393', '#FFA500', '#8D5524',
            ],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                return `${label}: ${value.toFixed(2)}%`; // Append % to the value
              },
            },
          },
        },
        maintainAspectRatio: true, // Maintain aspect ratio to prevent height issues
        responsive: true, // Make the chart responsive
      },
    };

    // Ensure the canvas context is valid
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, chartConfig);
      }
    }

    // Cleanup on component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [tokenBalances]);

  return (
    <div style={{ width: '200', maxWidth: '100', margin: '0 auto' }}>
      <canvas ref={chartRef} style={{ width: '200', height: '100' }} />
    </div>
  );
};

export default TokenDistributionChart;
