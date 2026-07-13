import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import socket from "../socket";
import "./PlayerProfile.css"; // Reusing the modern panel styles

export default function LiveScoreScreen() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatch() {
      try {
        const res = await API.get(`/matches/${matchId}`);
        setMatch(res.data);
      } catch (err) {
        console.error("Failed to fetch match:", err);
        alert("Could not load match data. Please go back and try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchMatch();

    socket.emit("join_match", matchId);

    const handleLiveUpdate = (updatedMatch) => {
      // Only update if it's the same match
      if (updatedMatch._id === matchId) {
        setMatch(updatedMatch);
      }
    };

    socket.on("live_update", handleLiveUpdate);

    return () => {
      socket.off("live_update", handleLiveUpdate);
    };
  }, [matchId]);

  const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

  // --- EVENT HANDLERS ---
  // These now just notify the backend. The backend is the source of truth.
  const handleRun = (runsScored) => {
    socket.emit('score_update', { matchId, type: 'run', payload: { runs: runsScored } });
  };

  const handleExtra = (type) => {
    socket.emit('score_update', { matchId, type: 'extra', payload: { type } });
  };

  const handleWicket = () => {
    // In a real app, this would open a modal to select wicket type, fielder, etc.
    socket.emit('score_update', { matchId, type: 'wicket', payload: { type: 'Caught' } });
  };

  const undoLastAction = () => {
    socket.emit('undo', { matchId });
  };

  const finishInnings = () => {
    if (window.confirm(`Are you sure you want to end the innings? Target will be ${match.runs + 1}.`)) {
      socket.emit('end_innings', { matchId });
      navigate('/matches');
    }
  };

  if (loading) {
    return <div className="panel ch-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem' }}>Loading Scoring Panel...</div>;
  }

  if (!match) {
    return <div className="panel ch-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem' }}>Match data could not be loaded.</div>;
  }

  // --- DERIVED STATE ---
  // Derive all display data from the single `match` state object
  const {
    teamA, teamB, battingTeam, totalOvers, innings,
    runs, wickets, balls, live, battingStats, bowlingStats
  } = match;

  // Defensive checks for live data
  const strikerName = live?.striker || '';
  const nonStrikerName = live?.nonStriker || '';
  const bowlerName = live?.bowler || '';

  const striker = battingStats?.[strikerName] ? { name: strikerName, ...battingStats[strikerName] } : { name: 'N/A', runs: 0, balls: 0, fours: 0, sixes: 0 };
  const nonStriker = battingStats?.[nonStrikerName] ? { name: nonStrikerName, ...battingStats[nonStrikerName] } : { name: 'N/A', runs: 0, balls: 0, fours: 0, sixes: 0 };
  const bowler = bowlingStats?.[bowlerName] ? { name: bowlerName, ...bowlingStats[bowlerName] } : { name: 'N/A', balls: 0, runs: 0, wickets: 0 };
  const thisOver = live?.thisOver || [];

  return (
    <div className="panel ch-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
         <button className="button secondary compact-button" onClick={() => navigate('/matches')}>&larr; Exit</button>
         <span style={{ fontWeight: 'bold', color: '#64748b' }}>{teamA} vs {teamB}</span>
      </div>

      {/* Giant Score Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', padding: '2rem 1.5rem', borderRadius: '16px', textAlign: 'center', marginBottom: '1.5rem', position: 'relative', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)' }}>
          <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Innings {innings} • {battingTeam} Batting
          </p>
          <h1 style={{ margin: '0', fontSize: '4.5rem', fontWeight: '800', lineHeight: '1' }}>
              {runs}<span style={{ color: '#ef4444' }}>/{wickets}</span>
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.25rem', color: '#cbd5e1' }}>
              Overs: <strong style={{ color: 'white' }}>{formatOvers(balls)}</strong> <span style={{ fontSize: '1rem', color: '#64748b' }}>/ {totalOvers}</span>
          </p>
          <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  CRR: {balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00'}
              </span>
          </div>
      </div>

      {/* Batters Mini-Table */}
      <div style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
              <span>Batters</span>
              <span style={{ display: 'flex', gap: '1rem' }}><span>R</span><span>B</span><span>4s</span><span>6s</span><span>SR</span></span>
          </div>
          <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', alignItems: 'center', background: 'rgba(56, 189, 248, 0.05)' }}>
              <span style={{ fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {striker.name} <span style={{ color: '#38bdf8', fontSize: '1.5rem', lineHeight: '0' }}>*</span>
              </span>
              <span style={{ display: 'flex', gap: '1rem', color: '#334155', width: '130px', justifyContent: 'space-between' }}>
                  <strong style={{ width: '20px', textAlign: 'right' }}>{striker.runs}</strong>
                  <span style={{ width: '20px', textAlign: 'right' }}>{striker.balls}</span>
                  <span style={{ width: '20px', textAlign: 'right' }}>{striker.fours || 0}</span>
                  <span style={{ width: '20px', textAlign: 'right' }}>{striker.sixes || 0}</span>
                  <span style={{ width: '30px', textAlign: 'right' }}>{striker.balls > 0 ? ((striker.runs/striker.balls)*100).toFixed(0) : 0}</span>
              </span>
          </div>
          <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#475569' }}>{nonStriker.name}</span>
              <span style={{ display: 'flex', gap: '1rem', color: '#64748b', width: '130px', justifyContent: 'space-between' }}>
                  <strong style={{ width: '20px', textAlign: 'right' }}>{nonStriker.runs}</strong>
                  <span style={{ width: '20px', textAlign: 'right' }}>{nonStriker.balls}</span>
                  <span style={{ width: '20px', textAlign: 'right' }}>{nonStriker.fours || 0}</span>
                  <span style={{ width: '20px', textAlign: 'right' }}>{nonStriker.sixes || 0}</span>
                  <span style={{ width: '30px', textAlign: 'right' }}>{nonStriker.balls > 0 ? ((nonStriker.runs/nonStriker.balls)*100).toFixed(0) : 0}</span>
              </span>
          </div>
      </div>

      {/* Bowler Mini-Table */}
      <div style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
           <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
              <span>Bowler</span>
              <span style={{ display: 'flex', gap: '1rem' }}><span>O</span><span>M</span><span>R</span><span>W</span><span>ER</span></span>
          </div>
          <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{bowler.name}</span>
              <span style={{ display: 'flex', gap: '1rem', color: '#334155', width: '130px', justifyContent: 'space-between' }}>
                  <strong style={{ width: '20px', textAlign: 'right' }}>{formatOvers(bowler.balls)}</strong>
                  <span style={{ width: '20px', textAlign: 'right' }}>0</span>
                  <span style={{ width: '20px', textAlign: 'right' }}>{bowler.runs}</span>
                  <strong style={{ width: '20px', textAlign: 'right', color: '#9333ea' }}>{bowler.wickets}</strong>
                  <span style={{ width: '30px', textAlign: 'right' }}>{bowler.balls > 0 ? ((bowler.runs/(bowler.balls/6))).toFixed(2) : '0.0'}</span>
              </span>
          </div>
      </div>

      {/* "This Over" Tracker */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 0.75rem 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Current Over</p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minHeight: '40px', flexWrap: 'wrap' }}>
              {thisOver.length === 0 && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Waiting for first delivery...</span>}
              {thisOver.map((ball, i) => (
                  <div key={i} style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem',
                      background: ball === 'W' ? '#ef4444' : ball === 4 || ball === 6 ? '#22c55e' : (typeof ball === 'string' ? '#f59e0b' : '#cbd5e1'),
                      color: ball === 'W' || ball === 4 || ball === 6 || typeof ball === 'string' ? 'white' : '#0f172a',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                      {ball}
                  </div>
              ))}
          </div>
      </div>

      {/* Main Scoring Numpad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1rem' }}>
          {[0, 1, 2, 3, 4, 6].map(num => (
              <button key={num} onClick={() => handleRun(num)} style={{ 
                  padding: '1.25rem', fontSize: '1.75rem', fontWeight: '800', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: num === 4 || num === 6 ? '#dcfce7' : '#f1f5f9',
                  color: num === 4 || num === 6 ? '#166534' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.1s'
              }}>
                  {num}
              </button>
          ))}
      </div>

      {/* Extras & Wickets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '2rem' }}>
          {['WD', 'NB', 'B', 'LB'].map(ext => (
              <button key={ext} onClick={() => handleExtra(ext)} style={{ padding: '1rem 0', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '10px', border: '1px solid #fcd34d', background: '#fffbeb', color: '#b45309', cursor: 'pointer' }}>{ext}</button>
          ))}
          <button onClick={handleWicket} style={{ padding: '1rem 0', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}>OUT</button>
      </div>

      {/* Footer Actions */}
      <div style={{ display: 'flex', gap: '1rem', borderTop: '2px solid #f1f5f9', paddingTop: '1.5rem' }}>
          <button onClick={undoLastAction} className="button secondary" style={{ flex: 1, padding: '1rem' }}>↩ Undo Last</button>
          <button onClick={finishInnings} className="button primary" style={{ flex: 1, padding: '1rem' }}>End Innings</button>
      </div>
    </div>
  );
}