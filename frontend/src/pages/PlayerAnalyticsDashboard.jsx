import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import API from "../api";
import WagonWheel from "../WagonWheel";
import PlayerCard from "../components/PlayerCard";
import PlayerComparison from "./PlayerComparison";
import "./PlayerAnalyticsDashboard.css";

function PlayerAnalyticsDashboard({ allPlayers, teams = [], fetchTeams }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTeamSelect, setShowTeamSelect] = useState(false);
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState("");
  const [activeTab, setActiveTab] = useState("profile"); // "profile" or "compare"

  useEffect(() => {
    API.get("/players")
      .then(res => setPlayers(res.data || []))
      .catch(err => console.warn("Could not fetch players", err));
  }, []);

  const handlePlayerChange = async (id) => {
    setSelectedPlayerId(id);
    setShowTeamSelect(false);
    setSelectedTeamToAdd("");
    if (!id) {
      setAnalyticsData(null);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch player details
      const playerRes = await API.get(`/players/${id}`);
      const player = playerRes.data;

      // 2. Fetch all matches to calculate match-by-match momentum.
      const matchesRes = await API.get("/matches");
      const allMatches = matchesRes.data || [];
      
      const matchPerformances = [];
      const aggregatedWagonWheel = { ...(player.batting?.wagonWheel || {}) };
      
      allMatches.forEach(match => {
        if (!match.matchResult) return; // Only count completed matches
        
        let batted = false;
        let bowled = false;
        let runsScored = 0, ballsFaced = 0, fours = 0, sixes = 0;
        let ballsBowled = 0, runsConceded = 0, wicketsTaken = 0;

        const checkInnings = (innings) => {
          if (!innings) return;
          if (innings.battingStats && innings.battingStats[player.name]) {
            batted = true;
            const stats = innings.battingStats[player.name];
            runsScored += stats.runs || 0;
            ballsFaced += stats.balls || 0;
            fours += stats.fours || 0;
            sixes += stats.sixes || 0;

            if (stats.wagonWheel) {
              Object.keys(stats.wagonWheel).forEach(region => {
                aggregatedWagonWheel[region] = (aggregatedWagonWheel[region] || 0) + stats.wagonWheel[region];
              });
            }
          }
          if (innings.bowlingStats && innings.bowlingStats[player.name]) {
            bowled = true;
            const stats = innings.bowlingStats[player.name];
            ballsBowled += stats.balls || 0;
            runsConceded += stats.runs || 0;
            wicketsTaken += stats.wickets || 0;
          }
        };

        if (match.firstInnings) checkInnings(match.firstInnings);
        if (match.innings === 2) checkInnings(match);
        if (match.innings === 1 && !match.firstInnings) checkInnings(match);

        if (batted || bowled) {
          const strikeRate = ballsFaced > 0 ? ((runsScored / ballsFaced) * 100).toFixed(1) : "0.0";
          const oversBowled = `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
          const vsTeam = match.teamA === player.team ? match.teamB : match.teamA;
          const economy = ballsBowled > 0 ? (runsConceded / (ballsBowled / 6)).toFixed(1) : "0.0";

          matchPerformances.push({
            matchId: match._id,
            teamA: match.teamA,
            teamB: match.teamB,
            batted,
            vsTeamShort: vsTeam.substring(0, 3).toUpperCase(),
            bowled,
            runsScored,
            ballsFaced,
            strikeRate,
            fours,
            sixes,
            oversBowled,
            runsConceded,
            wicketsTaken,
            economy
          });
        }
      });

      // Reverse to show chronological order from left to right on the chart
      setAnalyticsData({ player, matchPerformances: matchPerformances.reverse(), aggregatedWagonWheel });
    } catch (err) {
      console.warn("Could not fetch analytics", err);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTeam = async () => {
    if (!selectedTeamToAdd) return;
    const team = teams.find(t => t._id === selectedTeamToAdd);
    if (!team) return;

    const playerName = analyticsData.player.name;
    if (team.players && team.players.includes(playerName)) {
      alert(`${playerName} is already in ${team.name}`);
      return;
    }

    const newPlayers = [...(team.players || []), playerName];
    try {
      await API.put(`/teams/${team._id}`, { players: newPlayers });
      await API.put(`/players/${analyticsData.player._id}`, { team: team.name });
      
      alert(`Successfully recruited ${playerName} to ${team.name}!`);
      if (fetchTeams) fetchTeams();
      setShowTeamSelect(false);
    } catch (err) {
      console.error("Could not add player to team", err);
      alert("Failed to add player to team. Make sure the backend is running.");
    }
  };

  const renderMomentumGraph = (performances, statKey, maxVal, color) => {
    if (!performances || performances.length === 0) return <p className="empty-state">No data</p>;
    const maxValue = Math.max(...performances.map(p => Number(p[statKey])), maxVal);
    
    return (
      <div className="analytics-chart">
        {performances.map((perf, i) => {
          const heightPct = maxValue > 0 ? (Number(perf[statKey]) / maxValue) * 100 : 0;
          return (
            <div key={perf.matchId || i} className="chart-bar-container" title={`${perf.teamA} vs ${perf.teamB}: ${perf[statKey]}`}>
              <div 
                className="chart-bar" 
                style={{ 
                  height: `${heightPct}%`, 
                  backgroundColor: color 
                }}
              ></div>
              <span className="chart-label">{perf.vsTeamShort || `M${i + 1}`}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const getProfileStats = () => {
    if (!analyticsData) return null;
    const { player, matchPerformances } = analyticsData;
    const battedInnings = matchPerformances.filter(p => p.batted).length;
    const bowledInnings = matchPerformances.filter(p => p.bowled).length;

    const notOuts = 0;
    const dismissals = battedInnings - notOuts;
    
    const highestScore = matchPerformances.reduce((max, p) => p.batted && p.runsScored > max ? p.runsScored : max, 0);
    
    const bestBowling = matchPerformances.reduce((best, p) => {
      if (!p.bowled) return best;
      if (p.wicketsTaken > best.wickets || (p.wicketsTaken === best.wickets && p.runsConceded < best.runs)) {
        return { wickets: p.wicketsTaken, runs: p.runsConceded };
      }
      return best;
    }, { wickets: 0, runs: Infinity });
    const bestBowlingStr = bestBowling.wickets > 0 ? `${bestBowling.wickets}/${bestBowling.runs}` : '-';

    const strikeRate = player.batting?.balls > 0 ? ((player.batting.runs / player.batting.balls) * 100).toFixed(1) : "0.0";
    const battingAvg = dismissals > 0 ? ((player.batting?.runs || 0) / dismissals).toFixed(2) : "0.00";
    const economy = player.bowling?.balls > 0 ? (player.bowling.runs / (player.bowling.balls / 6)).toFixed(1) : "0.0";
    const overs = `${Math.floor((player.bowling?.balls || 0) / 6)}.${(player.bowling?.balls || 0) % 6}`;

    return {
      battedInnings,
      bowledInnings,
      highestScore,
      bestBowlingStr,
      strikeRate,
      battingAvg,
      economy,
      bowlingAvg: player.bowling?.wickets > 0 ? ((player.bowling?.runs || 0) / player.bowling.wickets).toFixed(2) : "0.00",
      overs
    };
  };

  const profileStats = getProfileStats();
  const reduceMotion = useReducedMotion();

  return (
    <motion.section className="panel" style={{ padding: "2rem" }} initial={reduceMotion ? {} : { opacity: 0, y: 20 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      <div className="panel-head" style={{ marginBottom: "1.5rem" }}>
        <div>
          <p className="label">Player Analytics</p>
          <h2>Analytics Hub</h2>
        </div>
        <p className="hint">Analyze individual player records and form trends, or compare players side-by-side.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="tab-navigation" style={{ 
        display: "flex", 
        gap: "10px", 
        borderBottom: "1px solid rgba(226, 232, 240, 0.1)", 
        paddingBottom: "12px",
        marginBottom: "2rem" 
      }}>
        <button 
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
          style={{
            background: activeTab === "profile" ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "rgba(255, 255, 255, 0.05)",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          👤 Career Profile
        </button>
        <button 
          className={`tab-btn ${activeTab === "compare" ? "active" : ""}`}
          onClick={() => setActiveTab("compare")}
          style={{
            background: activeTab === "compare" ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "rgba(255, 255, 255, 0.05)",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          ⚡ Compare Players
        </button>
      </div>

      {activeTab === "compare" ? (
        <PlayerComparison allPlayers={players} />
      ) : (
        <>
          <div className="form-row">
            <select 
              className="input" 
              value={selectedPlayerId} 
              onChange={(e) => handlePlayerChange(e.target.value)}
              style={{ borderRadius: "10px" }}
            >
              <option value="">Select a Player...</option>
              {players.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.team || "Free Agent"})</option>
              ))}
            </select>
          </div>

          {loading && <p>Loading profile...</p>}

          {!loading && analyticsData && profileStats && (
            <div className="analytics-container" style={{ marginTop: "2rem" }}>
              {/* Player Summary Card */}
              <div className="analytics-summary-card" style={{ display: 'flex', flexDirection: 'row', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap', padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-panel, #ffffff)', border: '1px solid rgba(226, 232, 240, 0.1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                
                {/* Left Column: Premium FIFA Card */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, margin: '0 auto' }}>
                  <PlayerCard player={analyticsData.player} matchPerformances={analyticsData.matchPerformances} />
                  <button 
                    className="button secondary compact-button" 
                    style={{ marginTop: '0.75rem', width: '100%', maxWidth: '280px', fontWeight: 'bold' }}
                    onClick={() => {
                      alert(`Player Card of ${analyticsData.player.name} is ready for share! Code: CMS-${analyticsData.player._id.slice(-6)}`);
                    }}
                  >
                    🔗 Share Player Card
                  </button>
                </div>

                {/* Right Column: Detailed Stats */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(241, 245, 249, 0.1)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '2rem', marginBottom: '0.2rem', color: 'var(--text-main)', fontWeight: '800' }}>{analyticsData.player.name}</h3>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: '600' }}>{analyticsData.player.team || "Free Agent"} | {analyticsData.player.role || "Player"}</p>
                        {analyticsData.player.bowlerType && analyticsData.player.bowlerType !== 'None' && (
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Bowling: {analyticsData.player.bowlerType}</p>
                        )}
                        {analyticsData.player.batterType && (
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Batting: {analyticsData.player.batterType}</p>
                        )}
                      </div>
                    </div>

                    {teams.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {!showTeamSelect ? (
                          <button className="button primary" onClick={() => setShowTeamSelect(true)}>
                            ➕ Add to My Team
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-input)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.1)' }}>
                            <select className="input compact-input" style={{ margin: 0 }} value={selectedTeamToAdd} onChange={(e) => setSelectedTeamToAdd(e.target.value)}>
                              <option value="">Select Team...</option>
                              {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                            <button className="button primary compact-button" onClick={handleAddToTeam}>Confirm</button>
                            <button className="button secondary compact-button" onClick={() => setShowTeamSelect(false)}>Cancel</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '700' }}>Career Summary</h4>
                    <div className="stats-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                      <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(2, 132, 199, 0.04) 100%)', borderColor: '#bae6fd', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(186, 230, 253, 0.2)', textAlign: 'center' }}>
                        <span className="stat-label" style={{ display: 'block', color: '#0ea5e9', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '600' }}>Matches</span>
                        <span className="stat-value" style={{ color: '#0ea5e9', fontSize: '1.75rem', fontWeight: '800' }}>{analyticsData.matchPerformances.length}</span>
                      </div>
                      <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)', borderColor: '#fed7aa', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(254, 215, 170, 0.2)', textAlign: 'center' }}>
                        <span className="stat-label" style={{ display: 'block', color: '#f97316', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '600' }}>Runs</span>
                        <span className="stat-value" style={{ color: '#f97316', fontSize: '1.75rem', fontWeight: '800' }}>{analyticsData.player.batting?.runs || 0}</span>
                      </div>
                      <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(147, 51, 234, 0.04) 100%)', borderColor: '#d8b4fe', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(216, 180, 254, 0.2)', textAlign: 'center' }}>
                        <span className="stat-label" style={{ display: 'block', color: '#a855f7', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '600' }}>High Score</span>
                        <span className="stat-value" style={{ color: '#a855f7', fontSize: '1.75rem', fontWeight: '800' }}>{profileStats.highestScore}</span>
                      </div>
                      <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.04) 100%)', borderColor: '#bbf7d0', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(187, 247, 208, 0.2)', textAlign: 'center' }}>
                        <span className="stat-label" style={{ display: 'block', color: '#22c55e', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '600' }}>Wickets</span>
                        <span className="stat-value" style={{ color: '#22c55e', fontSize: '1.75rem', fontWeight: '800' }}>{analyticsData.player.bowling?.wickets || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ width: "100%", marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(241, 245, 249, 0.1)', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>Batting Statistics</h4>
                  <div className="stats-overview" style={{ display: "flex", flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="stat-box">
                      <span className="stat-label">Innings</span>
                      <span className="stat-value">{profileStats.battedInnings}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Runs</span>
                      <span className="stat-value">{analyticsData.player.batting?.runs || 0}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Average</span>
                      <span className="stat-value">{profileStats.battingAvg}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Strike Rate</span>
                      <span className="stat-value">{profileStats.strikeRate}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Highest Score</span>
                      <span className="stat-value">{profileStats.highestScore}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">4s / 6s</span>
                      <span className="stat-value">{analyticsData.player.batting?.fours || 0} / {analyticsData.player.batting?.sixes || 0}</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: "100%", marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(241, 245, 249, 0.1)', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>Bowling Statistics</h4>
                  <div className="stats-overview" style={{ display: "flex", flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="stat-box">
                      <span className="stat-label">Innings</span>
                      <span className="stat-value">{profileStats.bowledInnings}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Wickets</span>
                      <span className="stat-value">{analyticsData.player.bowling?.wickets || 0}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Average</span>
                      <span className="stat-value">{profileStats.bowlingAvg}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Economy</span>
                      <span className="stat-value">{profileStats.economy}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Best Bowling</span>
                      <span className="stat-value">{profileStats.bestBowlingStr}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Overs</span>
                      <span className="stat-value">{profileStats.overs}</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: "100%", marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(241, 245, 249, 0.1)', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>Fielding Statistics</h4>
                  <div className="stats-overview" style={{ display: "flex", flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="stat-box">
                      <span className="stat-label">Catches</span>
                      <span className="stat-value">{analyticsData.player.fielding?.catches || 0}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Run Outs</span>
                      <span className="stat-value">{analyticsData.player.fielding?.runOuts || 0}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Stumpings</span>
                      <span className="stat-value">{analyticsData.player.fielding?.stumpings || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="analytics-grid" style={{ marginTop: "2rem" }}>
                {/* Batting Trend */}
                <div className="analytics-card">
                  <h3>Batting Form (Runs per Match)</h3>
                  {renderMomentumGraph(analyticsData.matchPerformances.filter(p => p.batted), 'runsScored', 10, '#0ea5e9')}
                </div>

                {/* Bowling Trend */}
                <div className="analytics-card">
                  <h3>Bowling Form (Wickets per Match)</h3>
                  {renderMomentumGraph(analyticsData.matchPerformances.filter(p => p.bowled), 'wicketsTaken', 3, '#a855f7')}
                </div>

                {/* Wagon Wheel */}
                <div className="analytics-card">
                  <h3>Career Wagon Wheel</h3>
                  <WagonWheel wagonWheelData={analyticsData.aggregatedWagonWheel || {}} />
                </div>
              </div>

              {/* Match Log */}
              <div className="analytics-card full-width" style={{ marginTop: "2rem" }}>
                <h3>Recent Performances</h3>
                <div className="table-responsive">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>Runs</th>
                        <th>Balls</th>
                        <th>SR</th>
                        <th>4s/6s</th>
                        <th>Overs</th>
                        <th>Wkts</th>
                        <th>Runs Given</th>
                        <th>Econ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.matchPerformances.length > 0 ? (
                        analyticsData.matchPerformances.map((perf, index) => (
                          <tr key={perf.matchId || index}>
                            <td>{perf.teamA} vs {perf.teamB}</td>
                            <td style={{ color: '#f97316', fontWeight: 'bold' }}>{perf.batted ? perf.runsScored : '-'}</td>
                            <td>{perf.batted ? perf.ballsFaced : '-'}</td>
                            <td>{perf.batted ? perf.strikeRate : '-'}</td>
                            <td>{perf.batted ? `${perf.fours}/${perf.sixes}` : '-'}</td>
                            <td>{perf.bowled ? perf.oversBowled : '-'}</td>
                            <td style={{ color: '#a855f7', fontWeight: 'bold' }}>{perf.bowled ? perf.wicketsTaken : '-'}</td>
                            <td>{perf.bowled ? perf.runsConceded : '-'}</td>
                            <td>{perf.bowled ? perf.economy : '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="empty-state" style={{ textAlign: 'center' }}>No completed match data available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Awards and Achievements */}
              <div className="analytics-card full-width" style={{ marginTop: "2rem" }}>
                <h3>Awards and Achievements</h3>
                <div className="achievements-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                  {analyticsData.player.awards && analyticsData.player.awards.length > 0 ? (
                    analyticsData.player.awards.map((award, i) => (
                      <div key={i} className="achievement-card" style={{ background: 'var(--bg-input, #f8fafc)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(226, 232, 240, 0.1)' }}>
                        <div className="achievement-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{award.icon || '🏆'}</div>
                        <div className="achievement-title" style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>{award.title}</div>
                        <div className="achievement-date" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{award.date}</div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="achievement-card" style={{ background: 'var(--bg-input, #f8fafc)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(226, 232, 240, 0.1)' }}>
                        <div className="achievement-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏅</div>
                        <div className="achievement-title" style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>Player of the Match</div>
                        <div className="achievement-date" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{analyticsData.matchPerformances.length > 0 ? 'Recent Match' : '-'}</div>
                      </div>
                      <div className="achievement-card" style={{ background: 'var(--bg-input, #f8fafc)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(226, 232, 240, 0.1)' }}>
                        <div className="achievement-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⭐</div>
                        <div className="achievement-title" style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>Valuable Player</div>
                        <div className="achievement-date" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Career</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}

export default PlayerAnalyticsDashboard;
