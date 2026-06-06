import { useEffect, useState } from "react";
import API from "../api";

function Rankings() {
  const [orangeCap, setOrangeCap] = useState([]);
  const [purpleCap, setPurpleCap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  async function fetchRankings() {
    try {
      setLoading(true);
      const orangeRes = await API.get("/rankings/orange-cap");
      const purpleRes = await API.get("/rankings/purple-cap");
      setOrangeCap(orangeRes.data || []);
      setPurpleCap(purpleRes.data || []);
    } catch (err) {
      console.error("Rankings Error:", err);
      setOrangeCap([]);
      setPurpleCap([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rankings-shell">
      <div className="rankings-header">
        <div>
          <p className="label">Leaderboard</p>
          <h2>🏆 IPL Leaderboard</h2>
        </div>
        <button className="button secondary" onClick={fetchRankings}>
          Refresh
        </button>
      </div>

      {loading && <p className="empty-state">⏳ Loading rankings...</p>}

      <div className="rankings-grid">
        <section className="ranking-card">
          <div className="ranking-title">
            <span className="cap-badge orange">🟠</span>
            <div>
              <h3>Orange Cap</h3>
              <p>Top Batsmen</p>
            </div>
          </div>

          <table className="stats-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Runs</th>
                <th>Balls</th>
                <th>Fours</th>
                <th>Sixes</th>
              </tr>
            </thead>
            <tbody>
              {orangeCap.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    No batting data available.
                  </td>
                </tr>
              ) : (
                orangeCap.map((p, index) => (
                  <tr key={p._id || index}>
                    <td>#{index + 1}</td>
                    <td>{p.name || "—"}</td>
                    <td>{p.batting?.runs || 0}</td>
                    <td>{p.batting?.balls || 0}</td>
                    <td>{p.batting?.fours || 0}</td>
                    <td>{p.batting?.sixes || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="ranking-card">
          <div className="ranking-title">
            <span className="cap-badge purple">🟣</span>
            <div>
              <h3>Purple Cap</h3>
              <p>Top Bowlers</p>
            </div>
          </div>

          <table className="stats-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Wickets</th>
                <th>Runs Given</th>
                <th>Overs</th>
              </tr>
            </thead>
            <tbody>
              {purpleCap.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">
                    No bowling data available.
                  </td>
                </tr>
              ) : (
                purpleCap.map((p, index) => (
                  <tr key={p._id || index}>
                    <td>#{index + 1}</td>
                    <td>{p.name || "—"}</td>
                    <td>{p.bowling?.wickets || 0}</td>
                    <td>{p.bowling?.runs || 0}</td>
                    <td>{p.bowling?.overs || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export default Rankings;
