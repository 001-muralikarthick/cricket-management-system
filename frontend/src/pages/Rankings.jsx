import { useState, useEffect } from "react";
import API from "../api";

function Rankings() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [orangeCap, setOrangeCap] = useState([]);
  const [purpleCap, setPurpleCap] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentRankings(selectedTournament);
    } else {
      fetchOverallRankings();
    }
  }, [selectedTournament]);

  async function fetchTournaments() {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data || []);
    } catch (err) {
      console.warn("Could not fetch tournaments", err);
    }
  }

  async function fetchTournamentRankings(tournamentId) {
    setLoading(true);
    try {
      // Update this route if your backend router uses a different path
      const res = await API.get(`/rankings/tournament/${tournamentId}`);
      setOrangeCap(res.data.orangeCap || []);
      setPurpleCap(res.data.purpleCap || []);
      setAllPlayers(res.data.allPlayers || []);
    } catch (err) {
      console.warn("Could not fetch tournament rankings", err);
      setOrangeCap([]);
      setPurpleCap([]);
      setAllPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOverallRankings() {
    setLoading(true);
    try {
      // Update these routes if your backend router uses different paths
      const [orangeRes, purpleRes, playersRes] = await Promise.all([
        API.get("/rankings/orange-cap"),
        API.get("/rankings/purple-cap"),
        API.get("/players")
      ]);
      setOrangeCap(orangeRes.data || []);
      setPurpleCap(purpleRes.data || []);
      setAllPlayers(playersRes.data || []);
    } catch (err) {
      console.warn("Could not fetch overall rankings", err);
      setOrangeCap([]);
      setPurpleCap([]);
      setAllPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rankings-shell">
      <div className="panel-head">
        <div>
          <p className="label">Leaderboards</p>
          <h2>Rankings</h2>
        </div>
        <p className="hint">Top performers across all matches or specific tournaments.</p>
      </div>

      <div className="form-row">
        <select 
          className="input" 
          value={selectedTournament} 
          onChange={(e) => setSelectedTournament(e.target.value)}
        >
          <option value="">Overall (All Matches)</option>
          {tournaments.map(t => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading rankings...</p>
      ) : (
        <div className="rankings-grid">
          {/* ORANGE CAP CARD */}
          <div className="ranking-card">
            <div className="ranking-title">
              <div className="cap-badge orange">
                🧢
              </div>
              <div>
                <h3>Orange Cap</h3>
                <p>Most Runs</p>
              </div>
            </div>
            <div className="table-responsive">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Batter</th>
                    <th>Runs</th>
                    <th>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {orangeCap.length > 0 ? orangeCap.map((player, index) => {
                    const stats = player.batting || {};
                    const runs = stats.runs || 0;
                    const balls = stats.balls || 0;
                    const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={index} className="bat-stat">
                        <td style={{ fontWeight: 'bold', color: '#64748b' }}>{index + 1}</td>
                        <td className="player-cell">
                          <span className="player-name">{player.name}</span>
                          {player.team && <span className="player-team">{player.team}</span>}
                        </td>
                        <td className="highlight-stat">{runs}</td>
                        <td>{sr}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="4" className="empty-state" style={{ textAlign: 'center', padding: '20px' }}>No batting data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PURPLE CAP CARD */}
          <div className="ranking-card">
            <div className="ranking-title">
              <div className="cap-badge purple">
                🧢
              </div>
              <div>
                <h3>Purple Cap</h3>
                <p>Most Wickets</p>
              </div>
            </div>
            <div className="table-responsive">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Bowler</th>
                    <th>Wkts</th>
                    <th>Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {purpleCap.length > 0 ? purpleCap.map((player, index) => {
                    const stats = player.bowling || {};
                    const wickets = stats.wickets || 0;
                    const runs = stats.runs || 0;
                    const oversCalc = stats.overs !== undefined ? stats.overs : (stats.balls ? stats.balls / 6 : 0);
                    const econ = oversCalc > 0 ? (runs / oversCalc).toFixed(1) : "0.0";
                    return (
                      <tr key={index} className="bowl-stat">
                        <td style={{ fontWeight: 'bold', color: '#64748b' }}>{index + 1}</td>
                        <td className="player-cell">
                          <span className="player-name">{player.name}</span>
                          {player.team && <span className="player-team">{player.team}</span>}
                        </td>
                        <td className="highlight-stat">{wickets}</td>
                        <td>{econ}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="4" className="empty-state" style={{ textAlign: 'center', padding: '20px' }}>No bowling data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ALL PLAYER STATS TABLE */}
          <div className="ranking-card" style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
            <div className="ranking-title">
              <div className="cap-badge" style={{ backgroundColor: "#f1f5f9" }}>
                <span style={{ fontSize: "1.5rem" }}>📊</span>
              </div>
              <div>
                <h3>All Player Statistics</h3>
                <p>Comprehensive Batting & Bowling Records</p>
              </div>
            </div>
            <div className="table-responsive">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th rowSpan="2" style={{ verticalAlign: "middle" }}>Player</th>
                    <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", borderLeft: "2px solid #e2e8f0" }}>Mat</th>
                    <th colSpan="5" style={{ textAlign: "center", borderLeft: "2px solid #e2e8f0", backgroundColor: "rgba(255, 237, 213, 0.2)" }}>Batting</th>
                    <th colSpan="4" style={{ textAlign: "center", borderLeft: "2px solid #e2e8f0", backgroundColor: "rgba(243, 232, 255, 0.3)" }}>Bowling</th>
                  </tr>
                  <tr style={{ backgroundColor: "#f8fafc", fontSize: "0.8rem" }}>
                    <th style={{ borderLeft: "2px solid #e2e8f0" }}>Runs</th>
                    <th>Balls</th>
                    <th>4s</th>
                    <th>6s</th>
                    <th>SR</th>
                    <th style={{ borderLeft: "2px solid #e2e8f0" }}>Overs</th>
                    <th>Runs</th>
                    <th>Wkts</th>
                    <th>Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {allPlayers.length > 0 ? allPlayers.map((player, index) => {
                    const bat = player.batting || {};
                    const bowl = player.bowling || {};
                    const batRuns = bat.runs || 0;
                    const batBalls = bat.balls || 0;
                    const batSR = batBalls > 0 ? ((batRuns / batBalls) * 100).toFixed(1) : "0.0";
                    const oversCalc = bowl.overs !== undefined ? bowl.overs : (bowl.balls ? bowl.balls / 6 : 0);
                    const bowlEcon = oversCalc > 0 ? ((bowl.runs || 0) / oversCalc).toFixed(1) : "0.0";
                    
                    return (
                      <tr key={player._id || index}>
                        <td className="player-cell">
                          <span className="player-name">{player.name}</span>
                          <span className="player-team">{player.team || "Unassigned"}</span>
                        </td>
                        <td style={{ borderLeft: "2px solid #e2e8f0", textAlign: "center", fontWeight: "bold", color: "#64748b" }}>{player.matches || 0}</td>
                        <td style={{ borderLeft: "2px solid #e2e8f0", fontWeight: "bold", color: "#ea580c" }}>{batRuns}</td>
                        <td>{batBalls}</td>
                        <td>{bat.fours || 0}</td>
                        <td>{bat.sixes || 0}</td>
                        <td>{batSR}</td>
                        <td style={{ borderLeft: "2px solid #e2e8f0" }}>{typeof oversCalc === 'number' ? oversCalc.toFixed(1) : "0.0"}</td>
                        <td>{bowl.runs || 0}</td>
                        <td style={{ fontWeight: "bold", color: "#9333ea" }}>{bowl.wickets || 0}</td>
                        <td>{bowlEcon}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="11" className="empty-state" style={{ textAlign: 'center', padding: '20px' }}>No player stats available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rankings;