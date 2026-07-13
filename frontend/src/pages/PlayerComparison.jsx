import React, { useState, useEffect } from "react";
import API from "../api";
import PlayerCard from "../components/PlayerCard";

export default function PlayerComparison({ allPlayers = [] }) {
  const [players, setPlayers] = useState([]);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [player1Data, setPlayer1Data] = useState(null);
  const [player2Data, setPlayer2Data] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  useEffect(() => {
    API.get("/players")
      .then(res => setPlayers(res.data || []))
      .catch(() => setPlayers(allPlayers));
  }, [allPlayers]);

  const fetchPlayerData = async (id) => {
    try {
      const res = await API.get(`/players/${id}`);
      return res.data;
    } catch {
      return players.find(p => p._id === id);
    }
  };

  const handleCompare = async () => {
    if (!player1Id || !player2Id) return;
    setLoading(true);
    
    try {
      const p1 = await fetchPlayerData(player1Id);
      const p2 = await fetchPlayerData(player2Id);
      
      setPlayer1Data(p1);
      setPlayer2Data(p2);
      
      // Calculate comparison result
      const result = calculateComparison(p1, p2);
      setComparisonResult(result);
    } catch (err) {
      console.error("Comparison failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerStats = (p) => ({
    runs: p.batting?.runs || 0,
    balls: p.batting?.balls || 0,
    fours: p.batting?.fours || 0,
    sixes: p.batting?.sixes || 0,
    wickets: p.bowling?.wickets || 0,
    bowlingBalls: p.bowling?.balls || 0,
    bowlingRuns: p.bowling?.runs || 0,
  });

  const calculateComparison = (p1, p2) => {
    const s1 = getPlayerStats(p1);
    const s2 = getPlayerStats(p2);
    
    const sr1 = s1.balls > 0 ? (s1.runs / s1.balls * 100) : 0;
    const sr2 = s2.balls > 0 ? (s2.runs / s2.balls * 100) : 0;
    const econ1 = s1.bowlingBalls > 0 ? (s1.bowlingRuns / (s1.bowlingBalls / 6)) : 0;
    const econ2 = s2.bowlingBalls > 0 ? (s2.bowlingRuns / (s2.bowlingBalls / 6)) : 0;
    
    // Batting index (weighted score)
    const battingIndex1 = (s1.runs * 0.4 + s1.fours * 0.2 + s1.sixes * 0.3 + sr1 * 0.1);
    const battingIndex2 = (s2.runs * 0.4 + s2.fours * 0.2 + s2.sixes * 0.3 + sr2 * 0.1);
    
    // Bowling index (lower economy is better)
    const bowlingIndex1 = (s1.wickets * 50) / (econ1 || 1);
    const bowlingIndex2 = (s2.wickets * 50) / (econ2 || 1);
    
    const totalIndex1 = battingIndex1 + bowlingIndex1;
    const totalIndex2 = battingIndex2 + bowlingIndex2;
    
    return {
      batting: {
        p1: s1.runs, p2: s2.runs,
        max: Math.max(s1.runs, s2.runs) || 1,
        label: "Total Runs"
      },
      fours: {
        p1: s1.fours, p2: s2.fours,
        max: Math.max(s1.fours, s2.fours) || 1,
        label: "Fours"
      },
      sixes: {
        p1: s1.sixes, p2: s2.sixes,
        max: Math.max(s1.sixes, s2.sixes) || 1,
        label: "Sixes"
      },
      strikeRate: {
        p1: Math.round(sr1 * 10) / 10,
        p2: Math.round(sr2 * 10) / 10,
        max: Math.max(sr1, sr2) || 1,
        label: "Strike Rate"
      },
      wickets: {
        p1: s1.wickets, p2: s2.wickets,
        max: Math.max(s1.wickets, s2.wickets) || 1,
        label: "Wickets"
      },
      economy: {
        p1: Math.round(econ1 * 100) / 100,
        p2: Math.round(econ2 * 100) / 100,
        max: Math.max(econ1 || 1, econ2 || 1),
        label: "Economy",
        lowerIsBetter: true
      },
      overall: {
        p1: Math.round(totalIndex1),
        p2: Math.round(totalIndex2),
        max: Math.max(totalIndex1, totalIndex2) || 1,
        label: "Performance Index"
      },
      battingIndex: { p1: battingIndex1, p2: battingIndex2 },
      bowlingIndex: { p1: bowlingIndex1, p2: bowlingIndex2 }
    };
  };

  const getVerdict = () => {
    if (!comparisonResult || !player1Data || !player2Data) return "";
    
    const { battingIndex, bowlingIndex, overall } = comparisonResult;
    const name1 = player1Data.name;
    const name2 = player2Data.name;

    const p1BatDominant = battingIndex.p1 > battingIndex.p2 * 1.15;
    const p2BatDominant = battingIndex.p2 > battingIndex.p1 * 1.15;
    const p1BowlDominant = bowlingIndex.p1 > bowlingIndex.p2 * 1.15;
    const p2BowlDominant = bowlingIndex.p2 > bowlingIndex.p1 * 1.15;

    let verdictText = "";

    if (p1BatDominant && p2BowlDominant) {
      verdictText = `⚔️ **Clash of Styles:** **${name1}** dominates the batting crease with superior scoring prowess, while **${name2}** answers back with highly lethal bowling analytics. A classic batsman vs. bowler matchup!`;
    } else if (p2BatDominant && p1BowlDominant) {
      verdictText = `⚔️ **Clash of Styles:** **${name2}** holds the batting advantage with higher run potential, whereas **${name1}** is the more impactful bowler. It is a thrilling duel of differing match roles!`;
    } else if (overall.p1 > overall.p2 * 1.25) {
      verdictText = `👑 **Total Dominance:** **${name1}** showcases a significantly higher impact index, outperforming ${name2} in nearly all facets of play.`;
    } else if (overall.p2 > overall.p1 * 1.25) {
      verdictText = `👑 **Total Dominance:** **${name2}** displays superior tactical stats, holding a massive edge over ${name1} in overall team value.`;
    } else {
      const winner = overall.p1 > overall.p2 ? name1 : name2;
      verdictText = `⚖️ **Tactical Advantage:** A highly competitive matchup! Both players are neck-and-neck, but **${winner}** holds a subtle edge due to more consistent contributions across key metrics.`;
    }

    return verdictText;
  };

  const renderBar = (label, value, max, p1Color, p2Color, lowerIsBetter = false) => {
    const p1Pct = max > 0 ? (value.p1 / max) * 100 : 0;
    const p2Pct = max > 0 ? (value.p2 / max) * 100 : 0;
    
    const p1Wins = lowerIsBetter ? value.p1 < value.p2 : value.p1 > value.p2;
    const p2Wins = lowerIsBetter ? value.p2 < value.p1 : value.p2 > value.p1;
    
    const diff = Math.abs(value.p1 - value.p2);
    const diffStr = diff % 1 === 0 ? diff.toLocaleString() : diff.toFixed(diff > 10 ? 1 : 2);

    return (
      <div className="comparison-row" style={{ 
        marginBottom: "1.5rem", 
        padding: "0.75rem 1rem",
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <p style={{ margin: 0, color: "var(--text-muted, #64748b)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {label}
          </p>
          {diff > 0 && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Margin: <strong style={{ color: p1Wins ? p1Color : p2Color }}>{diffStr}</strong>
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Player 1 value */}
          <div style={{ 
            minWidth: "70px", 
            textAlign: "right", 
            fontWeight: "900", 
            color: p1Wins ? "#22c55e" : "var(--text-muted, #94a3b8)",
            fontSize: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "4px"
          }}>
            {p1Wins && diff > 0 && (
              <span className="stat-diff-badge win">+{diffStr}</span>
            )}
            <span>{typeof value.p1 === 'number' ? value.p1.toLocaleString() : value.p1}</span>
          </div>
          
          {/* Bars */}
          <div style={{ flex: 1, display: "flex", gap: "4px", height: "24px", alignItems: "center" }}>
            {/* Player 1 bar (right-aligned) */}
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", background: "rgba(255,255,255,0.05)", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
              <div 
                className="comparison-bar-p1"
                style={{
                  width: `${p1Pct}%`, 
                  height: "100%",
                  background: `linear-gradient(90deg, ${p1Color}bb, ${p1Color})`,
                  borderRadius: "6px",
                  boxShadow: p1Wins ? `0 0 10px ${p1Color}aa` : "none"
                }} 
              />
            </div>
            
            {/* VS */}
            <div style={{
              width: "32px", 
              textAlign: "center", 
              fontSize: "0.7rem",
              color: "var(--text-muted, #94a3b8)", 
              fontWeight: 800, 
              flexShrink: 0
            }}>
              VS
            </div>
            
            {/* Player 2 bar (left-aligned) */}
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", background: "rgba(255,255,255,0.05)", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
              <div 
                className="comparison-bar-p2"
                style={{
                  width: `${p2Pct}%`, 
                  height: "100%",
                  background: `linear-gradient(90deg, ${p2Color}, ${p2Color}bb)`,
                  borderRadius: "6px",
                  boxShadow: p2Wins ? `0 0 10px ${p2Color}aa` : "none"
                }} 
              />
            </div>
          </div>
          
          {/* Player 2 value */}
          <div style={{ 
            minWidth: "70px", 
            textAlign: "left", 
            fontWeight: "900",
            color: p2Wins ? "#22c55e" : "var(--text-muted, #94a3b8)",
            fontSize: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "4px"
          }}>
            <span>{typeof value.p2 === 'number' ? value.p2.toLocaleString() : value.p2}</span>
            {p2Wins && diff > 0 && (
              <span className="stat-diff-badge win">+{diffStr}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="panel" style={{ position: "relative" }}>
      <style>{`
        @keyframes growBarLeft {
          from { width: 0; }
        }
        @keyframes growBarRight {
          from { width: 0; }
        }
        @keyframes popBadge {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .comparison-bar-p1 {
          animation: growBarLeft 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .comparison-bar-p2 {
          animation: growBarRight 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .stat-diff-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 4px;
          animation: popBadge 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
          display: inline-block;
          line-height: 1.2;
        }
        .stat-diff-badge.win {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.2);
        }
        .vs-pulse-badge {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ea580c, #f97316);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 900;
          margin: 0 auto;
          box-shadow: 0 0 15px rgba(234, 88, 12, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.2);
          position: relative;
          z-index: 2;
        }
        .vs-pulse-badge::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(234, 88, 12, 0.3);
          animation: pulse 2s infinite;
          z-index: -1;
        }
      `}</style>

      <div className="panel-head">
        <div>
          <p className="label">Player Comparison</p>
          <h2>Sports-Style Player Comparison</h2>
        </div>
        <p className="hint">Select two players to compare their batting, bowling, and overall impact metrics side-by-side.</p>
      </div>

      {/* Player Selectors */}
      <div className="form-row" style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <div style={{ flex: 1, minWidth: "220px" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted, #64748b)", fontSize: "0.85rem", fontWeight: 700 }}>
            Player 1
          </label>
          <select className="input" value={player1Id} onChange={(e) => setPlayer1Id(e.target.value)} style={{ borderRadius: "10px" }}>
            <option value="">Select first player...</option>
            {players.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.team || "Free Agent"})</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: "220px" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "var(--text-muted, #64748b)", fontSize: "0.85rem", fontWeight: 700 }}>
            Player 2
          </label>
          <select className="input" value={player2Id} onChange={(e) => setPlayer2Id(e.target.value)} style={{ borderRadius: "10px" }}>
            <option value="">Select second player...</option>
            {players.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.team || "Free Agent"})</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button 
            className="button primary" 
            onClick={handleCompare} 
            disabled={!player1Id || !player2Id || player1Id === player2Id || loading} 
            style={{ 
              height: "44px", 
              padding: "0 2rem", 
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              boxShadow: "0 4px 12px rgba(14, 165, 233, 0.25)",
              fontWeight: 700
            }}
          >
            {loading ? "Comparing..." : "⚡ Compare"}
          </button>
        </div>
      </div>

      {player1Data && player2Data && comparisonResult && (
        <div className="comparison-results" key={`${player1Id}-${player2Id}`} style={{ marginTop: "2rem" }}>
          {/* Player Headers / Card Display */}
          <div className="comparison-headers" style={{
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "2.5rem", 
            gap: "1rem",
            flexWrap: "wrap"
          }}>
            {/* Player 1 Card */}
            <div style={{ flex: "1 1 280px", display: "flex", justifyContent: "center" }}>
              <PlayerCard player={player1Data} />
            </div>

            {/* VS Badge */}
            <div style={{ textAlign: "center", flex: "0 0 80px", margin: "1rem 0" }}>
              <div className="vs-pulse-badge">
                VS
              </div>
            </div>

            {/* Player 2 Card */}
            <div style={{ flex: "1 1 280px", display: "flex", justifyContent: "center" }}>
              <PlayerCard player={player2Data} />
            </div>
          </div>

          {/* Stats Comparison Panel */}
          <div className="comparison-stats" style={{
            background: "var(--bg-panel, white)", 
            borderRadius: "16px", 
            border: "1px solid rgba(226, 232, 240, 0.1)",
            padding: "2rem", 
            boxShadow: "var(--shadow-md, 0 4px 20px rgba(0,0,0,0.05))"
          }}>
            <h3 style={{ 
              margin: "0 0 1.5rem 0", 
              color: "var(--text-main, #0f172a)", 
              fontSize: "1.25rem", 
              borderBottom: "1px solid rgba(241, 245, 249, 0.1)", 
              paddingBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span>📊</span> Attribute Head-to-Head
            </h3>

            {renderBar("Total Runs", comparisonResult.batting, comparisonResult.batting.max, "#0ea5e9", "#f97316")}
            {renderBar("Fours", comparisonResult.fours, comparisonResult.fours.max, "#0ea5e9", "#f97316")}
            {renderBar("Sixes", comparisonResult.sixes, comparisonResult.sixes.max, "#0ea5e9", "#f97316")}
            {renderBar("Strike Rate", comparisonResult.strikeRate, comparisonResult.strikeRate.max, "#0ea5e9", "#f97316")}
            {renderBar("Wickets", comparisonResult.wickets, comparisonResult.wickets.max, "#0ea5e9", "#f97316")}
            {renderBar("Economy", comparisonResult.economy, comparisonResult.economy.max, "#0ea5e9", "#f97316", true)}

            {/* Overall Rating Bar */}
            <div style={{
              marginTop: "2.5rem", 
              paddingTop: "2rem",
              borderTop: "2px dashed rgba(226, 232, 240, 0.1)"
            }}>
              <h4 style={{ 
                color: "var(--text-main, #0f172a)", 
                margin: "0 0 1.5rem 0", 
                fontSize: "1.1rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span>🏆</span> Overall Performance Index
              </h4>
              {renderBar("Match Impact Index", comparisonResult.overall, comparisonResult.overall.max, "#003a6c", "#ea580c")}
            </div>

            {/* Dynamic Analytical Verdict */}
            <div className="verdict-glow" style={{
              marginTop: "2rem", 
              padding: "1.25rem 1.5rem", 
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.03) 100%)",
              border: "1px solid rgba(34, 197, 94, 0.2)", 
              textAlign: "left"
            }}>
              <p 
                style={{ margin: 0, fontSize: "1rem", color: "var(--text-main, #0f172a)", lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: getVerdict() }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}