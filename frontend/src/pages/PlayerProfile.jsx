import { useEffect, useState } from "react";
import API from "../api";
import { useParams } from "react-router-dom";
import WagonWheel from "../WagonWheel";
import PlayerCard from "../components/PlayerCard";
import "./PlayerAnalyticsDashboard.css"; // Using the same styles
import "./PlayerProfile.css"; // Modern profile styles

function PlayerProfile() {
  const { id } = useParams();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (!id) {
      setAnalyticsData(null);
      setLoading(false);
      return;
    }

    async function fetchPlayerData(playerId) {
      setLoading(true);
      try {
        // 1. Fetch player details
        const playerRes = await API.get(`/players/${playerId}`);
        const player = playerRes.data;

        if (!player) {
          setAnalyticsData(null);
          setLoading(false);
          return;
        }

        // 2. Fetch all matches to calculate match-by-match momentum. NOTE: In a production app, this should be a dedicated backend endpoint that returns aggregated stats for a player to avoid client-side processing of all matches.
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
            const vsTeam = match.teamA === player.team ? match.teamB : match.teamA;
            const oversBowled = `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
            const economy = ballsBowled > 0 ? (runsConceded / (ballsBowled / 6)).toFixed(1) : "0.0";

            matchPerformances.push({
              matchId: match._id,
              teamA: match.teamA,
              teamB: match.teamB,
              vsTeamShort: vsTeam.substring(0, 3).toUpperCase(),
              batted,
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
    }

    fetchPlayerData(id);
  }, [id]);

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

    // TODO: For an accurate batting average, the number of times a player was "not out" is required.
    // This information should be added to the match performance data.
    const notOuts = 0;

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
    const dismissals = battedInnings - notOuts;
    const battingAvg = dismissals > 0 ? ((player.batting?.runs || 0) / dismissals).toFixed(2) : "0.00";
    const economy = player.bowling?.balls > 0 ? (player.bowling.runs / (player.bowling.balls / 6)).toFixed(1) : "0.0";
    const bowlingAvg = player.bowling?.wickets > 0 ? ((player.bowling?.runs || 0) / player.bowling.wickets).toFixed(2) : "0.00";
    const overs = `${Math.floor((player.bowling?.balls || 0) / 6)}.${(player.bowling?.balls || 0) % 6}`;

    return {
      battedInnings,
      bowledInnings,
      notOuts,
      highestScore,
      bestBowlingStr,
      strikeRate,
      battingAvg,
      economy,
      bowlingAvg,
      overs
    };
  };

  const profileStats = getProfileStats();

  if (loading) return <p className="panel">Loading profile...</p>;

  if (!analyticsData) return <p className="panel">Player not found or no data available.</p>;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="label">Player Profile</p>
          <h2>{analyticsData.player.name}</h2>
        </div>
        <p className="hint">Detailed career stats and match performances.</p>
      </div>

      {profileStats && (
        <div className="analytics-container">
          {/* Player Summary Card */}
          <div className="analytics-summary-card" style={{ display: 'flex', flexDirection: 'row', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap', padding: '1.5rem', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            
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
              <div className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '2rem', marginBottom: '0.2rem', color: '#0f172a', fontWeight: '800' }}>{analyticsData.player.name}</h3>
                    <p style={{ fontSize: '1.1rem', color: '#475569', fontWeight: '600' }}>{analyticsData.player.team} | {analyticsData.player.role || "Player"}</p>
                    {analyticsData.player.bowlerType && analyticsData.player.bowlerType !== 'None' && (
                      <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.2rem' }}>Bowling: {analyticsData.player.bowlerType}</p>
                    )}
                    {analyticsData.player.batterType && (
                      <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.2rem' }}>Batting: {analyticsData.player.batterType}</p>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#0f172a', fontSize: '1.2rem', fontWeight: '700' }}>Career Summary</h4>
                <div className="stats-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                  <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderColor: '#bae6fd', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                    <span className="stat-label" style={{ display: 'block', color: '#0369a1', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '600' }}>Matches</span>
                    <span className="stat-value" style={{ color: '#0369a1', fontSize: '1.75rem', fontWeight: '800' }}>{analyticsData.matchPerformances.length}</span>
                  </div>
                  <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', borderColor: '#fed7aa', padding: '1rem', borderRadius: '8px', border: '1px solid #fed7aa', textAlign: 'center' }}>
                    <span className="stat-label" style={{ display: 'block', color: '#c2410c', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '600' }}>Runs</span>
                    <span className="stat-value" style={{ color: '#c2410c', fontSize: '1.75rem', fontWeight: '800' }}>{analyticsData.player.batting?.runs || 0}</span>
                  </div>
                  <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f5f3ff, #e9d5ff)', borderColor: '#d8b4fe', padding: '1rem', borderRadius: '8px', border: '1px solid #d8b4fe', textAlign: 'center' }}>
                    <span className="stat-label" style={{ display: 'block', color: '#7e22ce', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '600' }}>High Score</span>
                    <span className="stat-value" style={{ color: '#7e22ce', fontSize: '1.75rem', fontWeight: '800' }}>{profileStats.highestScore}</span>
                  </div>
                  <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderColor: '#bbf7d0', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <span className="stat-label" style={{ display: 'block', color: '#15803d', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '600' }}>Wickets</span>
                    <span className="stat-value" style={{ color: '#15803d', fontSize: '1.75rem', fontWeight: '800' }}>{analyticsData.player.bowling?.wickets || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>Batting Statistics</h4>
              <div className="stats-overview" style={{ flexWrap: 'wrap', gap: '1rem' }}>
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

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>Bowling Statistics</h4>
              <div className="stats-overview" style={{ flexWrap: 'wrap', gap: '1rem' }}>
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

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>Fielding Statistics</h4>
              <div className="stats-overview" style={{ flexWrap: 'wrap', gap: '1rem' }}>
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

          <div className="analytics-grid">
            {/* Batting Trend */}
            <div className="analytics-card">
              <h3>Batting Form (Runs per Match)</h3>
              {renderMomentumGraph(analyticsData.matchPerformances.filter(p => p.batted), 'runsScored', 10, '#38bdf8')}
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
          <div className="analytics-card full-width">
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
                        <td style={{ color: '#ea580c', fontWeight: 'bold' }}>{perf.batted ? perf.runsScored : '-'}</td>
                        <td>{perf.batted ? perf.ballsFaced : '-'}</td>
                        <td>{perf.batted ? perf.strikeRate : '-'}</td>
                        <td>{perf.batted ? `${perf.fours}/${perf.sixes}` : '-'}</td>
                        <td>{perf.bowled ? perf.oversBowled : '-'}</td>
                        <td style={{ color: '#9333ea', fontWeight: 'bold' }}>{perf.bowled ? perf.wicketsTaken : '-'}</td>
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
          <div className="analytics-card full-width">
            <h3>Awards and Achievements</h3>
            <div className="achievements-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {analyticsData.player.awards && analyticsData.player.awards.length > 0 ? (
                analyticsData.player.awards.map((award, i) => (
                  <div key={i} className="achievement-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div className="achievement-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{award.icon || '🏆'}</div>
                    <div className="achievement-title" style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>{award.title}</div>
                    <div className="achievement-date" style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>{award.date}</div>
                  </div>
                ))
              ) : (
                <>
                  <div className="achievement-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div className="achievement-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏅</div>
                    <div className="achievement-title" style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>Player of the Match</div>
                    <div className="achievement-date" style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>{analyticsData.matchPerformances.length > 0 ? 'Recent Match' : '-'}</div>
                  </div>
                  <div className="achievement-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div className="achievement-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⭐</div>
                    <div className="achievement-title" style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>Valuable Player</div>
                    <div className="achievement-date" style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>Career</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default PlayerProfile;