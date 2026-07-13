import React from "react";

export default function WinProbability({ match }) {
  if (!match) return null;

  const { innings, runs, wickets, balls, totalOvers, firstInnings, teamA, teamB } = match;
  const isChase = innings === 2;
  if (!isChase || !firstInnings) {
    return (
      <div className="win-probability-container" style={{ marginBottom: "1rem" }}>
        <div className="panel-head" style={{ padding: "0.5rem 0" }}>
          <p className="label">Match Status</p>
          <h2>First innings in progress</h2>
        </div>
      </div>
    );
  }

  const target = firstInnings.runs + 1;
  const oversUsed = balls / 6;
  const maxOvers = Number(totalOvers) || 10;
  const oversRemaining = maxOvers - oversUsed;
  const wicketsRemaining = 10 - wickets;
  const runsNeeded = target - runs;
  const currentRunRate = oversUsed > 0 ? runs / oversUsed : 0;
  const requiredRunRate = oversRemaining > 0 ? runsNeeded / oversRemaining : 999;

  // Win probability calculation using a simplified Duckworth-Lewis style model
  let battingTeamWinProb = 0;
  let bowlingTeamWinProb = 0;

  if (runsNeeded <= 0) {
    battingTeamWinProb = 100;
  } else if (wicketsRemaining <= 0 || oversRemaining <= 0) {
    bowlingTeamWinProb = 100;
  } else {
    // Resource-based calculation
    const wicketsFactor = wicketsRemaining / 10; // 0 to 1, higher = better
    const oversFactor = oversRemaining / maxOvers; // 0 to 1, higher = better
    const runRateFactor = Math.min(requiredRunRate / (currentRunRate || 1), 3); // cap at 3x
    
    // Batting team resources (higher is better for chaser)
    const battingResources = (wicketsFactor * 0.5 + oversFactor * 0.3) * 100;
    // Run rate pressure (higher RR required = lower win prob)
    const rrPressure = Math.max(0, 100 - (runRateFactor - 0.5) * 40);
    
    battingTeamWinProb = Math.min(95, Math.max(5, battingResources * 0.4 + rrPressure * 0.6));
    
    // Adjust for closeness of the game
    const runsFactor = Math.min(runsNeeded / (target || 1), 1);
    const closenessFactor = (1 - runsFactor) * 30;
    battingTeamWinProb = Math.min(95, Math.max(5, battingTeamWinProb + closenessFactor));
    
    bowlingTeamWinProb = 100 - battingTeamWinProb;
  }

  const battingTeam = teamB;
  const bowlingTeam = teamA;
  const battingWinProb = Math.round(battingTeamWinProb);
  const bowlingWinProb = Math.round(bowlingTeamWinProb);

  const getColor = (prob) => {
    if (prob >= 70) return "#16a34a";
    if (prob >= 50) return "#eab308";
    if (prob >= 30) return "#f97316";
    return "#dc2626";
  };

  return (
    <div className="win-probability-container" style={{
      background: "white", borderRadius: "12px", border: "1px solid #e2e8f0",
      padding: "1.25rem", marginBottom: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
    }}>
      <div className="panel-head" style={{ padding: 0, marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="label" style={{ margin: 0 }}>Live Win Probability</p>
            <h2 style={{ fontSize: "1.1rem", margin: "0.25rem 0 0 0" }}>
              {battingTeam} need {runsNeeded} runs in {formatOversFromBalls(Math.round(oversRemaining * 6))} overs
            </h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Target: {target}</span>
          </div>
        </div>
      </div>

      {/* Win Probability Bar */}
      <div style={{
        background: "#f1f5f9", borderRadius: "8px", overflow: "hidden",
        height: "32px", position: "relative", marginBottom: "0.75rem"
      }}>
        {/* Bowling team (left side) */}
        <div style={{
          width: `${bowlingWinProb}%`, height: "100%",
          background: `linear-gradient(90deg, #6366f1, #818cf8)`,
          transition: "width 0.5s ease-in-out",
          display: "flex", alignItems: "center", justifyContent: "flex-start",
          paddingLeft: "8px", position: "absolute", left: 0, top: 0,
          borderRadius: bowlingWinProb > 0 ? "8px 0 0 8px" : "8px"
        }}>
          {bowlingWinProb > 15 && (
            <span style={{ color: "white", fontWeight: "bold", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
              {bowlingTeam}: {bowlingWinProb}%
            </span>
          )}
        </div>
        {/* Batting team (right side) */}
        <div style={{
          width: `${battingWinProb}%`, height: "100%",
          background: `linear-gradient(90deg, #f97316, #fb923c)`,
          transition: "width 0.5s ease-in-out",
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          paddingRight: "8px", position: "absolute", right: 0, top: 0,
          borderRadius: battingWinProb > 0 ? "0 8px 8px 0" : "8px"
        }}>
          {battingWinProb > 15 && (
            <span style={{ color: "white", fontWeight: "bold", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
              {battingTeam}: {battingWinProb}%
            </span>
          )}
        </div>
        {/* Center divider */}
        <div style={{
          position: "absolute", left: "50%", top: 0, bottom: 0, width: "2px",
          background: "rgba(255,255,255,0.8)", transform: "translateX(-50%)"
        }} />
      </div>

      {/* Match stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem"
      }}>
        <div style={{ textAlign: "center", padding: "0.5rem", background: "#f8fafc", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>CRR</p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.1rem", fontWeight: "bold", color: "#0f172a" }}>
            {currentRunRate.toFixed(2)}
          </p>
        </div>
        <div style={{ textAlign: "center", padding: "0.5rem", background: "#f8fafc", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>RRR</p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.1rem", fontWeight: "bold", color: requiredRunRate > currentRunRate * 1.3 ? "#dc2626" : "#16a34a" }}>
            {requiredRunRate.toFixed(2)}
          </p>
        </div>
        <div style={{ textAlign: "center", padding: "0.5rem", background: "#f8fafc", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Wkts Left</p>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.1rem", fontWeight: "bold", color: "#0f172a" }}>
            {wicketsRemaining}
          </p>
        </div>
      </div>

      {/* Dynamic message */}
      <div style={{ marginTop: "0.75rem", padding: "0.5rem", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#166534", textAlign: "center" }}>
          {battingWinProb >= 70
            ? `${battingTeam} are firmly in control. Need just ${runsNeeded} more with ${wicketsRemaining} wickets in hand.`
            : battingWinProb >= 50
            ? `Game evenly poised! ${battingTeam} need ${runsNeeded} runs at ${requiredRunRate.toFixed(1)} RRR.`
            : battingWinProb >= 30
            ? `${bowlingTeam} have the upper hand. ${battingTeam} need a strong partnership.`
            : `${bowlingTeam} are overwhelming favorites. Requires a miracle for ${battingTeam}.`
          }
        </p>
      </div>
    </div>
  );
}

function formatOversFromBalls(totalBalls) {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
}