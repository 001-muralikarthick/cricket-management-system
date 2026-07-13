import React from 'react';
import { PolarArea } from 'react-chartjs-2';
import { FIELDING_REGIONS } from '../constants';
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

const WagonWheel = ({ wagonWheelData }) => {
  // Define standard cricket fielding regions, combining all possibilities
  const regions = FIELDING_REGIONS;

  // Map the received stats to our regions (defaulting to 0 if no runs were scored there)
  const dataValues = (regions || []).map(region => wagonWheelData?.[region] || 0);

  const data = {
    labels: regions || [],
    datasets: [
      {
        label: 'Runs Scored',
        data: dataValues,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(40, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.4)',
          'rgba(54, 162, 235, 0.4)',
          'rgba(255, 206, 86, 0.4)',
          'rgba(75, 192, 192, 0.4)',
          'rgba(153, 102, 255, 0.4)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        beginAtZero: true,
        ticks: { stepSize: 10 }
      }
    },
    plugins: {
      legend: { position: 'right' }
    }
  };

  return (
    <div style={{ maxWidth: '500px', height: '500px', margin: '0 auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Wagon Wheel Analysis</h3>
      {wagonWheelData && Object.keys(wagonWheelData).length > 0 ? (
        <PolarArea data={data} options={options} />
      ) : (
        <p style={{ textAlign: 'center', color: 'gray', marginTop: '50px' }}>No wagon wheel data available for this player.</p>
      )}
    </div>
  );
};

export default WagonWheel;