import React, { useState, useEffect } from 'react';
import API from '../api';
import WagonWheel from '../components/WagonWheel';

const PlayerAnalyticsDashboard = ({ allPlayers }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedPlayerId) {
      setPlayerData(null);
      return;
    }

    const fetchPlayerData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await API.get(`/players/${selectedPlayerId}`);
        setPlayerData(res.data);
      } catch (err) {
        setError('Failed to fetch player data. The server might be offline.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [selectedPlayerId]);

  const formatOvers = (totalBalls) => {
    if (!totalBalls) return '0.0';
    return `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
  };

  const renderStatCard = (title, stats) => (
    <div className="stat-card">
      <h4>{title}</h4>
      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat.label} className="stat-item">
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const batting = playerData?.batting;
  const bowling = playerData?.bowling;

  const battingStats = batting ? [
    { label: 'Runs', value: batting.runs || 0 },
    { label: 'Balls', value: batting.balls || 0 },
    { label: 'Strike Rate', value: batting.balls > 0 ? ((batting.runs / batting.balls) * 100).toFixed(2) : '0.00' },
    { label: 'Fours', value: batting.fours || 0 },
    { label: 'Sixes', value: batting.sixes || 0 },
  ] : [];

  const bowlingStats = bowling ? [
    { label: 'Overs', value: formatOvers(bowling.balls || 0) },
    { label: 'Runs', value: bowling.runs || 0 },
    { label: 'Wickets', value: bowling.wickets || 0 },
    { label: 'Economy', value: bowling.balls > 0 ? ((bowling.runs / (bowling.balls / 6))).toFixed(2) : '0.00' },
  ] : [];

  return (
    <div className="panel analytics-dashboard">
      <div className="panel-head">
        <div>
          <p className="label">Player Analytics</p>
          <h2>Career Statistics & Visualizations</h2>
        </div>
        <p className="hint">Select a player to view their detailed career performance, including a wagon wheel of their scoring shots.</p>
      </div>

      <div className="form-row" style={{ marginBottom: '2rem' }}>
        <select
          className="input"
          value={selectedPlayerId}
          onChange={(e) => setSelectedPlayerId(e.target.value)}
        >
          <option value="">-- Select a Player --</option>
          {allPlayers.sort((a, b) => a.name.localeCompare(b.name)).map(player => (
            <option key={player._id} value={player._id}>
              {player.name} ({player.team})
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="loading-state">Loading player data...</p>}
      {error && <p className="error-state">{error}</p>}

      {playerData && (
        <div className="player-stats-content">
          <h3>{playerData.name} - {playerData.team}</h3>
          <p className="player-meta">{playerData.role} {playerData.bowlerType && `(${playerData.bowlerType})`}</p>
          
          <div className="stats-container">
            {renderStatCard('Batting Career', battingStats)}
            {renderStatCard('Bowling Career', bowlingStats)}
          </div>

          <div className="visualization-container">
            <WagonWheel wagonWheelData={playerData.batting.wagonWheel} />
          </div>
        </div>
      )}

      {!playerData && !loading && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '8px' }}>
          <p>Please select a player to see their statistics.</p>
        </div>
      )}
      <style>{`
        .analytics-dashboard .stats-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .stat-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .stat-card h4 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 15px; }
        .stat-item { text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: bold; color: #007bff; display: block; }
        .stat-label { font-size: 0.8rem; color: #6c757d; text-transform: uppercase; }
        .player-meta { color: #6c757d; font-style: italic; margin-bottom: 20px; }
        .visualization-container { margin-top: 40px; }
      `}</style>
    </div>
  );
};

export default PlayerAnalyticsDashboard;