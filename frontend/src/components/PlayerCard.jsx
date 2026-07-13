import React from "react";
import "./PlayerCard.css";

export default function PlayerCard({ player, matchPerformances = [] }) {
  if (!player) return null;

  // Extract stats
  const runs = player.batting?.runs || 0;
  const balls = player.batting?.balls || 0;
  const wickets = player.bowling?.wickets || 0;
  const bowlingBalls = player.bowling?.balls || 0;
  const bowlingRuns = player.bowling?.runs || 0;
  const catches = player.fielding?.catches || 0;
  const runOuts = player.fielding?.runOuts || 0;
  const stumpings = player.fielding?.stumpings || 0;

  const matchesCount = Math.max(matchPerformances.length, player.matchesPlayed || 1);
  const battedInnings = matchPerformances.filter(p => p.batted).length || 1;
  const dismissedCount = Math.max(battedInnings, 1); // Mocked dismissals equal to innings for simplicity
  const average = dismissedCount > 0 ? runs / dismissedCount : 0;
  const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;
  const economy = bowlingBalls > 0 ? (bowlingRuns / (bowlingBalls / 6)) : 0;

  // --- ATTRIBUTE CALCULATIONS ---

  // 1. Batting Rating (BAT): Weighted runs, average, and strike rate
  const rawBat = (runs * 0.25) + (average * 0.4) + (strikeRate * 0.35);
  const batScore = Math.min(99, Math.max(45, Math.round(45 + Math.min(rawBat, 50))));

  // 2. Strike Rate Rating (SR): Standardized strike rate
  const srScore = Math.min(99, Math.max(35, Math.round(35 + Math.min(strikeRate / 2, 60))));

  // 3. Wickets Rating (WKT): Total wickets relative to typical career
  const wktScore = Math.min(99, Math.max(35, Math.round(35 + Math.min(wickets * 8, 60))));

  // 4. Economy Rating (ECO): 6.0 is excellent (99), 12.0+ is poor (35)
  const ecoScore = economy > 0 
    ? Math.min(99, Math.max(35, Math.round(100 - (economy * 6.5))))
    : 50; // default for non-bowlers

  // 5. Fielding Rating (FLD): Catches, run outs, stumpings
  const rawFld = (catches * 5) + (runOuts * 8) + (stumpings * 10);
  const fldScore = Math.min(99, Math.max(45, Math.round(45 + Math.min(rawFld, 50))));

  // 6. Experience Rating (EXP): Matches played
  const expScore = Math.min(99, Math.max(40, Math.round(40 + Math.min(matchesCount * 4, 55))));

  // --- OVERALL RATING (OVR) ---
  const role = player.role || "Player";
  let ovr = 60;

  if (role.toLowerCase().includes("batsman") || role.toLowerCase().includes("wicketkeeper")) {
    ovr = Math.round((batScore * 0.55) + (srScore * 0.25) + (fldScore * 0.1) + (expScore * 0.1));
  } else if (role.toLowerCase().includes("bowler")) {
    ovr = Math.round((wktScore * 0.55) + (ecoScore * 0.25) + (fldScore * 0.1) + (expScore * 0.1));
  } else { // All-rounder / Default
    ovr = Math.round((batScore * 0.3) + (srScore * 0.15) + (wktScore * 0.3) + (ecoScore * 0.15) + (expScore * 0.1));
  }

  // Ensure OVR is sensible
  ovr = Math.min(99, Math.max(45, ovr));

  // Determine Card Theme & Style
  let cardTheme = "card-theme-silver";
  if (player.role === "Captain" || ovr >= 85) {
    cardTheme = "card-theme-legendary";
  } else if (ovr >= 72) {
    cardTheme = "card-theme-gold";
  }

  const initials = player.name
    ? player.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "P";

  return (
    <div className="player-card-wrapper">
      <div className={`player-card-container ${cardTheme}`}>
        <div className="card-shine" />
        <div className="card-content">
          
          {/* Header Badge Row */}
          <div className="card-header-block">
            <div className="rating-badge">
              <span className="rating-number">{ovr}</span>
              <span className="rating-position">
                {role.toLowerCase().includes("batsman") ? "BAT" : role.toLowerCase().includes("bowler") ? "BOWL" : "ALL"}
              </span>
            </div>
            {player.role === "Captain" && (
              <span className="captain-badge">CAPTAIN</span>
            )}
          </div>

          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-halo" />
            <div className="avatar-image-container">
              {player.photoUrl ? (
                <img
                  src={player.photoUrl}
                  alt={player.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span className="avatar-fallback">{initials}</span>
              )}
            </div>
          </div>

          {/* Name & Team Info */}
          <h3 className="player-card-name">{player.name}</h3>
          <p className="player-card-team">{player.team || "Free Agent"}</p>
          
          <div className="card-divider" />

          {/* Ultimate Attributes Grid */}
          <div className="card-stats-grid">
            <div className="card-stat-item">
              <span className="card-stat-value">{batScore}</span>
              <span className="card-stat-label">BAT</span>
            </div>
            <div className="card-stat-item">
              <span className="card-stat-value">{srScore}</span>
              <span className="card-stat-label">SR</span>
            </div>
            <div className="card-stat-item">
              <span className="card-stat-value">{wktScore}</span>
              <span className="card-stat-label">WKT</span>
            </div>
            <div className="card-stat-item">
              <span className="card-stat-value">{ecoScore}</span>
              <span className="card-stat-label">ECO</span>
            </div>
            <div className="card-stat-item">
              <span className="card-stat-value">{fldScore}</span>
              <span className="card-stat-label">FLD</span>
            </div>
            <div className="card-stat-item">
              <span className="card-stat-value">{expScore}</span>
              <span className="card-stat-label">EXP</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
