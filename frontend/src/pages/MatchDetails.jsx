import React, { useState, useEffect } from "react";
import API from "../api";
import socket from "../socket";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function formatOvers(totalBalls) {
  return `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
}

export default function MatchDetails({ matchId, onBack }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatch() {
      try {
        const res = await API.get(`/matches/${matchId}`);
        setMatch(res.data);
      } catch (err) {
        console.error("Failed to fetch match:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatch();

    socket.emit("join_match", matchId);

    const handleLiveUpdate = (updatedMatch) => {
      setMatch(updatedMatch);
    };

    socket.on("live_update", handleLiveUpdate);

    return () => {
      socket.off("live_update", handleLiveUpdate);
    };
  }, [matchId]);

  const handleDownloadPdf = () => {
    if (!matchId) return;
    window.open(`${API.defaults.baseURL}/matches/${matchId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="panel">
        <button className="button secondary" onClick={onBack} style={{ marginBottom: "1rem" }}>
          &larr; Back
        </button>
        <p className="empty-state">Loading match details...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="panel">
        <button className="button secondary" onClick={onBack} style={{ marginBottom: "1rem" }}>
          &larr; Back
        </button>
        <p className="empty-state">Match not found.</p>
      </div>
    );
  }

  // Gather innings
  const inningsList = [];

  if (match.firstInnings) {
    inningsList.push(match.firstInnings);
  }

  if (!match.firstInnings && match.innings === 1) {
    inningsList.push({
      team: match.teamA,
      battingTeam: match.teamA,
      bowlingTeam: match.teamB,
      runs: match.runs,
      wickets: match.wickets,
      balls: match.balls,
      extras: match.extras,
      battingStats: match.battingStats,
      bowlingStats: match.bowlingStats,
      history: match.history,
    });
  }

  if (match.innings === 2) {
    inningsList.push({
      team: match.teamB,
      battingTeam: match.teamB,
      bowlingTeam: match.teamA,
      runs: match.runs,
      wickets: match.wickets,
      balls: match.balls,
      extras: match.extras,
      battingStats: match.battingStats,
      bowlingStats: match.bowlingStats,
      history: match.history,
    });
  }

  // CricHeroes style MVP Calculator
  const getPlayerOfTheMatch = () => {
    if (!match.matchResult || inningsList.length === 0) return null;
    
    const playerPoints = {};
    
    inningsList.forEach(inns => {
      // Batting points
      Object.entries(inns.battingStats || {}).forEach(([player, stats]) => {
        let pts = (stats.runs || 0) * 1; // 1 pt per run
        pts += (stats.fours || 0) * 1; // 1 extra pt per boundary
        pts += (stats.sixes || 0) * 2; // 2 extra pts per six
        if (stats.runs >= 30) pts += 10; // Milestone bonus
        if (stats.runs >= 50) pts += 20;
        if (stats.runs >= 100) pts += 40;
        
        playerPoints[player] = (playerPoints[player] || 0) + pts;
      });
      
      // Bowling points
      Object.entries(inns.bowlingStats || {}).forEach(([player, stats]) => {
        let pts = (stats.wickets || 0) * 20; // 20 pts per wicket
        const overs = stats.balls / 6;
        if (overs >= 1 && stats.runs / overs <= 5) pts += 15; // Economy bonus
        if (stats.wickets >= 3) pts += 20; // Milestone bonus
        if (stats.wickets >= 5) pts += 40;
        
        playerPoints[player] = (playerPoints[player] || 0) + pts;
      });
    });

    let mvp = null;
    let maxPts = -1;
    
    for (const [playerName, pts] of Object.entries(playerPoints)) {
      if (pts > maxPts) {
        maxPts = pts;
        mvp = { name: playerName, points: pts };
      }
    }
    
    return mvp;
  };

  const mvp = getPlayerOfTheMatch();

  function renderMomentumGraph(history, teamColor, teamName) {
    if (!history || history.length === 0) return null;

    const maxOvers = match.totalOvers || 10;
    const overRuns = Array(maxOvers).fill(0);
    const overWickets = Array(maxOvers).fill(0);

    history.forEach(ball => {
      const overIndex = ball.over;
      if (overIndex < maxOvers) {
        overRuns[overIndex] += ball.runs;
        if (ball.wicket) {
          overWickets[overIndex] += 1;
        }
      }
    });

    const labels = Array.from({ length: maxOvers }, (_, i) => `Over ${i + 1}`);

    const data = {
      labels,
      datasets: [
        {
          label: `${teamName} Runs`,
          data: overRuns,
          backgroundColor: teamColor === '#38bdf8' ? 'rgba(14, 165, 233, 0.7)' : 'rgba(249, 115, 22, 0.7)',
          borderColor: teamColor === '#38bdf8' ? '#0ea5e9' : '#f97316',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { font: { size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            footer: (tooltipItems) => {
              const overIdx = tooltipItems[0].dataIndex;
              const wkts = overWickets[overIdx];
              return wkts > 0 ? `Wickets: ${'W'.repeat(wkts)}` : 'No wickets';
            }
          }
        }
      }
    };

    return (
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: "0 0 0.75rem 0", color: "#475569", fontSize: "0.95rem", fontWeight: "bold" }}>
          📊 Manhattan Chart (Runs per Over)
        </h4>
        <div style={{ height: '140px', position: 'relative' }}>
          <Bar data={data} options={options} />
        </div>
      </div>
    );
  }

  function renderWormGraph() {
    if (inningsList.length === 0) return null;

    const maxOvers = match.totalOvers || 10;
    
    const processInnsData = (inns) => {
      const overRuns = Array(maxOvers).fill(0);
      inns.history?.forEach(ball => {
        const overIndex = ball.over;
        if (overIndex < maxOvers) {
          overRuns[overIndex] += ball.runs;
        }
      });
      const cumulative = [0];
      let sum = 0;
      for (let i = 0; i < maxOvers; i++) {
        sum += overRuns[i];
        cumulative.push(sum);
      }
      return cumulative;
    };

    const teamACumulative = processInnsData(inningsList[0]);
    const teamBCumulative = inningsList[1] ? processInnsData(inningsList[1]) : null;

    const labels = Array.from({ length: maxOvers + 1 }, (_, i) => `${i}`);

    const datasets = [
      {
        label: inningsList[0].team,
        data: teamACumulative,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.05)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5
      }
    ];

    if (inningsList[1] && teamBCumulative) {
      datasets.push({
        label: inningsList[1].team,
        data: teamBCumulative,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.05)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5
      });
    }

    const data = { labels, datasets };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          title: { display: true, text: 'Runs', font: { size: 10, weight: 'bold' } }
        },
        x: {
          grid: { color: 'rgba(0, 0, 0, 0.03)' },
          title: { display: true, text: 'Overs', font: { size: 10, weight: 'bold' } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    };

    return (
      <div className="worm-graph" style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: "0 0 0.75rem 0", color: "#475569", fontSize: "0.95rem", fontWeight: "bold" }}>
          📈 Worm Chart (Cumulative Runs Progression)
        </h4>
        <div style={{ height: '220px', position: 'relative' }}>
          <Line data={data} options={options} />
        </div>
      </div>
    );
  }

  return (
    <section className="panel ch-card">
      <div className="panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button className="button secondary" onClick={onBack}>
              &larr; Back to Matches
            </button>
            {match.matchResult && (
              <button className="button secondary" onClick={handleDownloadPdf}>
                Download PDF
              </button>
            )}
          </div>
          <p className="label">Match Center</p>
          <h2>{match.teamA} vs {match.teamB}</h2>
          <p className="hint">{match.totalOvers} Overs Match &bull; {new Date(match.createdAt).toLocaleDateString()}</p>
        </div>
        {match.matchResult && (
          <div style={{
            fontWeight: "bold",
            color: "#166534",
            background: "#dcfce7",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid #bbf7d0"
          }}>
            {match.matchResult}
          </div>
        )}
        {!match.matchResult && (
          <div style={{
            fontWeight: "bold",
            color: "#854d0e",
            background: "#fef08a",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid #fde047"
          }}>
            Match in progress
          </div>
        )}
      </div>

      {mvp && (
        <div style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', 
          color: 'white', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          marginBottom: '2rem',
          display: 'flex', 
          alignItems: 'center', 
          gap: '1.5rem',
          boxShadow: '0 10px 15px -3px rgba(234, 88, 12, 0.3)'
        }}>
          <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>🏆</div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9 }}>Player of the Match</h4>
            <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '2rem', fontWeight: '800' }}>{mvp.name}</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', opacity: 0.9 }}>Impact Score: {Math.round(mvp.points)} pts</p>
          </div>
        </div>
      )}

      <div className="history-panel">
        <div className="history-header" style={{ fontSize: "1.25rem", marginBottom: "1rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Match Center</span>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', fontWeight: 'normal' }}>
             {inningsList[0] && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'12px',height:'12px',background:'#38bdf8',borderRadius:'4px'}}></div> {inningsList[0].team}</span>}
             {inningsList[1] && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{width:'12px',height:'12px',background:'#fbbf24',borderRadius:'4px'}}></div> {inningsList[1].team}</span>}
          </div>
        </div>
        {inningsList.length === 0 && <p className="empty-state">No scoreboards available yet.</p>}
        
        {renderWormGraph()}

        <div className="stats-summary-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          {inningsList.map((item, index) => (
            <section key={`${item.team}-${index}`} className="mini-scorecard" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", background: "white" }}>
              <div className="history-header" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1rem", color: "#0f172a", fontSize: "1.1rem" }}>
                <strong>{item.team} Innings</strong> - {item.runs}/{item.wickets} ({formatOvers(item.balls)})
              </div>
              
              {renderMomentumGraph(item.history, index === 0 ? '#38bdf8' : '#fbbf24', item.team)}

              <h4 style={{ margin: "0 0 0.5rem 0", color: "#475569" }}>Batting</h4>
              <div className="compact-table" style={{ marginBottom: "1.5rem" }}>
                <div className="compact-row table-head" style={{ fontWeight: "bold", color: "#64748b" }}>
                  <span>Batter</span>
                  <span>R</span>
                  <span>B</span>
                  <span>4s</span>
                  <span>6s</span>
                  <span>SR</span>
                </div>
                {Object.entries(item.battingStats || {}).map(([player, stats]) => {
                  const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={player} className="compact-row" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontWeight: "500", color: "#0f172a" }}>{player}</span>
                      <span>{stats.runs || 0}</span>
                      <span>{stats.balls || 0}</span>
                      <span>{stats.fours || 0}</span>
                      <span>{stats.sixes || 0}</span>
                      <span>{sr}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "#64748b" }}>
                <strong>Extras: </strong> 
                {item.extras ? (
                  `${(item.extras.wides || 0) + (item.extras.noBalls || 0) + (item.extras.byes || 0) + (item.extras.legByes || 0)} 
                  (W ${item.extras.wides || 0}, NB ${item.extras.noBalls || 0}, B ${item.extras.byes || 0}, LB ${item.extras.legByes || 0})`
                ) : "0"}
              </div>

              <h4 style={{ margin: "0 0 0.5rem 0", color: "#475569" }}>Bowling</h4>
              <div className="compact-table">
                <div className="compact-row table-head" style={{ fontWeight: "bold", color: "#64748b" }}>
                  <span>Bowler</span>
                  <span>O</span>
                  <span>R</span>
                  <span>W</span>
                  <span>Econ</span>
                </div>
                {Object.entries(item.bowlingStats || {}).map(([player, stats]) => {
                  const overs = stats.balls / 6;
                  const econ = overs > 0 ? (stats.runs / overs).toFixed(1) : "0.0";
                  return (
                    <div key={player} className="compact-row" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontWeight: "500", color: "#0f172a" }}>{player}</span>
                      <span>{formatOvers(stats.balls || 0)}</span>
                      <span>{stats.runs || 0}</span>
                      <span>{stats.wickets || 0}</span>
                      <span>{econ}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
