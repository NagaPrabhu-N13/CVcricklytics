import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Leaderboard = ({ players }) => {
  // Filter and sort top 3 batsmen by batting average
  const topBatsmen = players
    .filter((player) => player.battingAvg !== null)
    .sort((a, b) => b.battingAvg - a.battingAvg)
    .slice(0, 3);

  // Filter and sort top 3 bowlers by bowling average (lower is better, but we'll use wickets or avg for demo)
  const topBowlers = players
    .filter((player) => player.bowlingAvg !== null)
    .sort((a, b) => a.bowlingAvg - b.bowlingAvg) // Lower bowling avg is better
    .slice(0, 3);

  // Batting Chart Data
  const battingChartData = {
    labels: topBatsmen.map((player) => player.name),
    datasets: [
      {
        label: 'Batting Average',
        data: topBatsmen.map((player) => player.battingAvg),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Bowling Chart Data
  const bowlingChartData = {
    labels: topBowlers.map((player) => player.name),
    datasets: [
      {
        label: 'Bowling Average',
        data: topBowlers.map((player) => player.bowlingAvg),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart Options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="container mx-auto p-6 mt-8 bg-white rounded-lg shadow-md ">
      <h2 className="text-4xl font-bold text-gray-900 pb-30 mb-6 text-center">Leaderboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Batsmen Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Batsmen</h3>
          <Bar
            data={battingChartData}
            options={{ ...options, plugins: { ...options.plugins, title: { ...options.plugins.title, text: 'Top Batsmen by Average' } } }}
          />
        </div>

        {/* Top Bowlers Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Bowlers</h3>
          <Bar
            data={bowlingChartData}
            options={{ ...options, plugins: { ...options.plugins, title: { ...options.plugins.title, text: 'Top Bowlers by Average' } } }}
          />
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;