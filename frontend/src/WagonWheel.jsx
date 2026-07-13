import React from 'react';
import { PolarArea } from 'react-chartjs-2';
import { FIELDING_REGIONS } from './constants';
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

const WagonWheel = ({ wagonWheelData, playerName }) => {
  const regions = FIELDING_REGIONS;
  
  const dataValues = (regions || []).map(region => wagonWheelData?.[region] || 0);
  const totalRuns = dataValues.reduce((sum, val) => sum + val, 0);
  
  const maxRuns = Math.max(...dataValues, 1);

  const cricketColors = {
    'Third Man': { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgba(59, 130, 246, 1)' },
    'Point': { bg: 'rgba(16, 185, 129, 0.7)', border: 'rgba(16, 185, 129, 1)' },
    'Deep Point': { bg: 'rgba(52, 211, 153, 0.7)', border: 'rgba(52, 211, 153, 1)' },
    'Cover': { bg: 'rgba(132, 204, 22, 0.7)', border: 'rgba(132, 204, 22, 1)' },
    'Extra Cover': { bg: 'rgba(163, 230, 53, 0.7)', border: 'rgba(163, 230, 53, 1)' },
    'Mid Off': { bg: 'rgba(250, 204, 21, 0.7)', border: 'rgba(250, 204, 21, 1)' },
    'Long Off': { bg: 'rgba(251, 191, 36, 0.7)', border: 'rgba(251, 191, 36, 1)' },
    'Mid On': { bg: 'rgba(251, 146, 60, 0.7)', border: 'rgba(251, 146, 60, 1)' },
    'Long On': { bg: 'rgba(251, 113, 133, 0.7)', border: 'rgba(251, 113, 133, 1)' },
    'Mid Wicket': { bg: 'rgba(244, 114, 182, 0.7)', border: 'rgba(244, 114, 182, 1)' },
    'Deep Mid Wicket': { bg: 'rgba(232, 121, 249, 0.7)', border: 'rgba(232, 121, 249, 1)' },
    'Square Leg': { bg: 'rgba(192, 132, 252, 0.7)', border: 'rgba(192, 132, 252, 1)' },
    'Deep Square Leg': { bg: 'rgba(167, 139, 250, 0.7)', border: 'rgba(167, 139, 250, 1)' },
    'Fine Leg': { bg: 'rgba(139, 92, 246, 0.7)', border: 'rgba(139, 92, 246, 1)' },
  };

  const backgroundColors = regions.map(region => cricketColors[region]?.bg || 'rgba(156, 163, 175, 0.7)');
  const borderColors = regions.map(region => cricketColors[region]?.border || 'rgba(156, 163, 175, 1)');

  const data = {
    labels: regions || [],
    datasets: [
      {
        label: 'Runs Scored',
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          stepSize: Math.ceil(maxRuns / 5) || 1,
          backdropColor: 'transparent',
          color: '#64748b',
          font: { size: 11, weight: '600' }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.08)',
          lineWidth: 1
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1
        },
        pointLabels: {
          color: '#0f172a',
          font: { size: 10, weight: '600' },
          padding: 8
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 12,
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fbbf24',
        bodyColor: '#fff',
        borderColor: 'rgba(251, 191, 36, 0.5)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed.r || 0;
            const percentage = totalRuns > 0 ? ((value / totalRuns) * 100).toFixed(1) : 0;
            return ` ${label}: ${value} runs (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  const topRegions = regions
    .map((region, idx) => ({ region, runs: dataValues[idx] }))
    .filter(item => item.runs > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5);

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '24px', 
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          color: '#0f172a', 
          fontSize: '1.4rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1.6rem' }}>🎯</span>
          Wagon Wheel Analysis
        </h3>
        {playerName && (
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
            {playerName}
          </p>
        )}
      </div>

      {wagonWheelData && Object.keys(wagonWheelData).length > 0 ? (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            marginBottom: '20px',
            padding: '12px',
            background: 'linear-gradient(135deg, #003a6c 0%, #0ea5e9 100%)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>{totalRuns}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>Total Runs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>{topRegions.length}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>Regions Hit</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>
                {totalRuns > 0 ? ((topRegions[0]?.runs || 0) / totalRuns * 100).toFixed(0) : 0}%
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>Top Region</div>
            </div>
          </div>

          <div style={{ 
            padding: '16px', 
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            marginBottom: '16px'
          }}>
            <PolarArea data={data} options={options} />
          </div>

          {topRegions.length > 0 && (
            <div style={{
              padding: '16px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '0.95rem', 
                color: '#0f172a',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ display: 'inline-block', width: '3px', height: '14px', background: '#f59e0b', borderRadius: '2px' }}></span>
                Top Scoring Regions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topRegions.map((item, idx) => {
                  const percentage = totalRuns > 0 ? (item.runs / totalRuns * 100).toFixed(1) : 0;
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      padding: '8px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: cricketColors[item.region]?.bg || 'rgba(156, 163, 175, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: '600', 
                          color: '#0f172a',
                          marginBottom: '4px'
                        }}>
                          {item.region}
                        </div>
                        <div style={{
                          height: '6px',
                          background: '#e2e8f0',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${cricketColors[item.region]?.border || '#94a3b8'}, ${cricketColors[item.region]?.bg || 'rgba(156, 163, 175, 0.7)'})`,
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                      </div>
                      <div style={{ 
                        textAlign: 'right',
                        minWidth: '60px'
                      }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>{item.runs}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.3 }}>🎯</div>
          <p style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '600', color: '#475569' }}>
            No wagon wheel data available
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            Start scoring matches to see shot distribution analysis
          </p>
        </div>
      )}
    </div>
  );
};

export default WagonWheel;