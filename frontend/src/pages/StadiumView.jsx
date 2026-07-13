import React, { useState, useMemo } from "react";

const FIELD_REGIONS = [
  { id: "Third Man", angle: -45, distance: 0.85 },
  { id: "Point", angle: -65, distance: 0.55 },
  { id: "Deep Point", angle: -65, distance: 0.85 },
  { id: "Cover", angle: -85, distance: 0.55 },
  { id: "Extra Cover", angle: -95, distance: 0.55 },
  { id: "Mid Off", angle: -110, distance: 0.55 },
  { id: "Long Off", angle: -110, distance: 0.85 },
  { id: "Mid On", angle: -70, distance: 0.55 },
  { id: "Long On", angle: -70, distance: 0.85 },
  { id: "Mid Wicket", angle: -45, distance: 0.55 },
  { id: "Deep Mid Wicket", angle: -45, distance: 0.85 },
  { id: "Square Leg", angle: -25, distance: 0.55 },
  { id: "Deep Square Leg", angle: -25, distance: 0.85 },
  { id: "Fine Leg", angle: -10, distance: 0.85 },
];

// Define 11 standard fielders and their default angles/distances on the field
const DEFAULT_FIELDERS = [
  { id: "wk", name: "Keeper", angle: 0, distance: 0.15 },
  { id: "slip", name: "Slip", angle: 25, distance: 0.15 },
  { id: "point", name: "Point", angle: -65, distance: 0.45 },
  { id: "cover", name: "Cover", angle: -85, distance: 0.45 },
  { id: "mid_off", name: "Mid Off", angle: -110, distance: 0.45 },
  { id: "mid_on", name: "Mid On", angle: -70, distance: 0.45 },
  { id: "mid_wicket", name: "Mid Wkt", angle: -45, distance: 0.45 },
  { id: "square_leg", name: "Sq Leg", angle: -25, distance: 0.45 },
  { id: "fine_leg", name: "Fine Leg", angle: -10, distance: 0.75 },
  { id: "third_man", name: "Third Man", angle: -45, distance: 0.75 },
  { id: "long_on", name: "Long On", angle: -70, distance: 0.75 }
];

export default function StadiumView({ match, battingStats, allPlayers = [] }) {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  
  if (!match) {
    return (
      <div className="stadium-view-container" style={{
        background: "white", borderRadius: "12px", border: "1px solid #e2e8f0",
        padding: "1.5rem", marginBottom: "1rem"
      }}>
        <div className="panel-head" style={{ padding: 0 }}>
          <p className="label">Stadium View</p>
          <h2>Live Field Visualization</h2>
        </div>
        <p className="empty-state">Start a match to see the stadium view.</p>
      </div>
    );
  }

  // Build aggregated wagon wheel data from batting stats
  const aggregatedWagonWheel = {};
  if (battingStats) {
    Object.values(battingStats).forEach(stats => {
      if (stats.wagonWheel) {
        Object.entries(stats.wagonWheel).forEach(([region, runs]) => {
          aggregatedWagonWheel[region] = (aggregatedWagonWheel[region] || 0) + runs;
        });
      }
    });
  }

  const maxRuns = Math.max(...Object.values(aggregatedWagonWheel), 1);
  const totalRuns = Object.values(aggregatedWagonWheel).reduce((a, b) => a + b, 0);

  // Resolve fielders' default coordinates based on SVG dimensions
  const resolvedFielders = useMemo(() => {
    return DEFAULT_FIELDERS.map(f => {
      const radians = (f.angle * Math.PI) / 180;
      const r = 200 * f.distance;
      const coords = {
        x: 250 + r * Math.sin(radians),
        y: 250 - r * Math.cos(radians)
      };
      
      // Special adjustments for WK and Slip which are behind the batsman
      if (f.id === "wk") return { ...f, x: 250, y: 325 };
      if (f.id === "slip") return { ...f, x: 236, y: 318 };
      
      return { ...f, x: coords.x, y: coords.y };
    });
  }, []);

  // Precompute ball physics, nearest fielder, and particle systems when the last ball changes
  const lastBall = match?.lastBall;
  const isBowledOrLbw = useMemo(() => {
    return !!(lastBall && lastBall.wicket && (lastBall.wicketType === "Bowled" || lastBall.wicketType === "LBW" || !lastBall.shotRegion));
  }, [lastBall]);

  const trajectoryDetails = useMemo(() => {
    if (!lastBall) return null;
    
    let endX = 250;
    let endY = 310;
    let targetRegion = null;

    if (isBowledOrLbw) {
      endY = 300; // hits stumps
    } else if (lastBall.shotRegion) {
      targetRegion = FIELD_REGIONS.find(r => r.id === lastBall.shotRegion);
      if (targetRegion) {
        const radians = (targetRegion.angle * Math.PI) / 180;
        const r = 200 * targetRegion.distance;
        endX = 250 + r * Math.sin(radians);
        endY = 250 - r * Math.cos(radians);
      }
    }

    const startX = 250;
    const startY = 310; // batsman's end
    const ctrlX = (startX + endX) / 2;
    const ctrlY = Math.min(startY, endY) - 70;
    
    const bowlPath = "M 250 185 Q 250 250 250 310";
    const shotPath = `M 250 310 Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
    
    // Find closest fielder to intercept
    let closestFielderId = "";
    let minDistance = Infinity;
    resolvedFielders.forEach(f => {
      const dx = f.x - endX;
      const dy = f.y - endY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestFielderId = f.id;
      }
    });

    // Particle system (Confetti/Wicket bursts)
    const particleList = [];
    if (lastBall.runs >= 4 || lastBall.wicket) {
      const particleCount = 20;
      const colors = ["#fbbf24", "#60a5fa", "#34d399", "#f87171", "#c084fc", "#f472b6", "#fb923c"];
      for (let i = 0; i < particleCount; i++) {
        const angle = (i * (360 / particleCount) + Math.random() * 18) * Math.PI / 180;
        const dist = 30 + Math.random() * 65;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 3 + Math.random() * 4;
        particleList.push({
          id: i,
          dx: dist * Math.cos(angle),
          dy: dist * Math.sin(angle),
          color,
          size,
          type: Math.random() > 0.5 ? "circle" : "rect"
        });
      }
    }

    // Badge styling details
    let badgeBg = "#f1f5f9";
    let badgeStroke = "#cbd5e1";
    let badgeColor = "#475569";
    let badgeText = "Dot Ball";

    if (lastBall.wicket) {
      badgeBg = "#fee2e2";
      badgeStroke = "#fca5a5";
      badgeColor = "#dc2626";
      badgeText = lastBall.wicketType ? lastBall.wicketType.toUpperCase() : "WICKET";
    } else if (lastBall.runs === 4) {
      badgeBg = "#dcfce7";
      badgeStroke = "#86efac";
      badgeColor = "#15803d";
      badgeText = "FOUR! 🏏";
    } else if (lastBall.runs === 6) {
      badgeBg = "#fef9c3";
      badgeStroke = "#fef08a";
      badgeColor = "#a16207";
      badgeText = "SIX! 🚀";
    } else if (lastBall.runs > 0) {
      badgeBg = "#e0f2fe";
      badgeStroke = "#bae6fd";
      badgeColor = "#0369a1";
      badgeText = `+${lastBall.runs} Run${lastBall.runs > 1 ? "s" : ""}`;
    } else if (lastBall.extraType) {
      badgeBg = "#fffbeb";
      badgeStroke = "#fde68a";
      badgeColor = "#b45309";
      badgeText = lastBall.extraType.toUpperCase();
    }

    return {
      startX, startY, endX, endY, ctrlX, ctrlY,
      bowlPath, shotPath, closestFielderId,
      particles: particleList,
      badgeBg, badgeStroke, badgeColor, badgeText
    };
  }, [lastBall, isBowledOrLbw, resolvedFielders]);

  // SVG center and dimensions
  const cx = 250, cy = 250, radius = 200;
  const pitchLength = 120, pitchWidth = 20;
  
  // Calculate pitch coordinates (vertical, top is bowler end, bottom is striker end)
  const pitchTopY = cy - pitchLength / 2;
  const pitchBottomY = cy + pitchLength / 2;
  const pitchX = cx - pitchWidth / 2;

  const getRegionCoords = (region, offset = 1) => {
    const radians = (region.angle * Math.PI) / 180;
    const r = radius * region.distance * offset;
    return {
      x: cx + r * Math.sin(radians),
      y: cy - r * Math.cos(radians)
    };
  };

  const getDotColor = (runs) => {
    if (runs === 0) return "#e2e8f0";
    const intensity = Math.min(runs / (maxRuns || 1), 1);
    if (intensity > 0.6) return "#dc2626";
    if (intensity > 0.3) return "#f97316";
    return "#facc15";
  };

  const getDotSize = (runs) => {
    if (runs === 0) return 4;
    return Math.max(6, Math.min(20, 6 + (runs / (maxRuns || 1)) * 14));
  };

  return (
    <div className="stadium-view-container" style={{
      background: "white", borderRadius: "12px", border: "1px solid #e2e8f0",
      padding: "1.5rem", marginBottom: "1rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
    }}>
      <div className="panel-head" style={{ padding: 0, marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="label" style={{ margin: 0 }}>Cricket Ground Visualization</p>
            <h2 style={{ fontSize: "1.1rem", margin: "0.25rem 0 0 0" }}>
              {match.teamA} vs {match.teamB}
            </h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Total Runs: <strong>{totalRuns}</strong>
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        {/* SVG Stadium */}
        <div className="stadium-svg-wrapper" style={{
          flex: "0 0 auto",
          position: "relative"
        }}>
          <svg 
            width="500" 
            height="500" 
            viewBox="0 0 500 500"
            style={{ background: "#f8fafc", borderRadius: "12px" }}
          >
            <defs>
              <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#ef4444" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="ballGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="80%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </radialGradient>
            </defs>
            {/* Outer ground boundary */}
            <ellipse cx={cx} cy={cy} rx={radius} ry={radius * 0.9} fill="#86efac" stroke="#16a34a" strokeWidth="2" />
            
            {/* Inner ring (30 yard circle) */}
            <ellipse cx={cx} cy={cy} rx={radius * 0.55} ry={radius * 0.5} fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="6,4" />
            
            {/* Pitch */}
            <rect 
              x={pitchX} y={pitchTopY} 
              width={pitchWidth} height={pitchLength} 
              fill="#d4a373" stroke="#92400e" strokeWidth="1" 
              rx="2"
            />
            
            {/* Pitch crease lines */}
            <line x1={pitchX - 5} y1={pitchTopY + 20} x2={pitchX + pitchWidth + 5} y2={pitchTopY + 20} stroke="white" strokeWidth="1" />
            <line x1={pitchX - 5} y1={pitchBottomY - 20} x2={pitchX + pitchWidth + 5} y2={pitchBottomY - 20} stroke="white" strokeWidth="1" />
            
            {/* Stumps at each end */}
            {[pitchTopY + 10, pitchBottomY - 10].map((y, i) => (
              <g key={i}>
                <line x1={cx - 3} y1={y} x2={cx - 3} y2={y + 8} stroke="#92400e" strokeWidth="2" />
                <line x1={cx} y1={y} x2={cx} y2={y + 8} stroke="#92400e" strokeWidth="2" />
                <line x1={cx + 3} y1={y} x2={cx + 3} y2={y + 8} stroke="#92400e" strokeWidth="2" />
                {/* Bails */}
                <line x1={cx - 3} y1={y} x2={cx + 3} y2={y} stroke="#fbbf24" strokeWidth="2" />
              </g>
            ))}
            
            {/* Bowler/Striker labels */}
            <text x={cx} y={pitchTopY - 10} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600">
              BOWLER'S END
            </text>
            <text x={cx} y={pitchBottomY + 20} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600">
              BATSMAN'S END
            </text>
            
            {/* Region dots with runs overlay */}
            {FIELD_REGIONS.map((region) => {
              const runs = aggregatedWagonWheel[region.id] || 0;
              const coords = getRegionCoords(region, 1);
              const dotSize = getDotSize(runs);
              const isHovered = hoveredRegion === region.id;
              
              return (
                <g key={region.id}>
                  {/* Glowing effect for hovered region */}
                  {isHovered && (
                    <circle 
                      cx={coords.x} cy={coords.y} r={dotSize + 8}
                      fill="none" stroke="#0ea5e9" strokeWidth="2"
                      opacity="0.6"
                    >
                      <animate attributeName="r" from={dotSize + 4} to={dotSize + 12} dur="1s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="1s" repeatCount="indefinite" />
                    </circle>
                  )}
                  
                  {/* Region dot */}
                  <circle 
                    cx={coords.x} cy={coords.y} r={dotSize}
                    fill={getDotColor(runs)}
                    stroke={runs > 0 ? "#1e293b" : "none"}
                    strokeWidth={runs > 0 ? 1.5 : 0}
                    opacity={runs > 0 ? 0.85 : 0.3}
                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  />
                  
                  {/* Runs label on larger dots */}
                  {runs > 0 && dotSize > 10 && (
                    <text 
                      x={coords.x} y={coords.y + 3}
                      textAnchor="middle" fill="white" fontSize="8"
                      fontWeight="bold" pointerEvents="none"
                    >
                      {runs}
                    </text>
                  )}
                  
                  {/* Region label */}
                  <text 
                    x={coords.x} y={coords.y + dotSize + 14}
                    textAnchor="middle"
                    fill={isHovered ? "#0ea5e9" : "#64748b"}
                    fontSize={isHovered ? "11" : "9"}
                    fontWeight={isHovered ? "bold" : "normal"}
                    pointerEvents="none"
                    style={{ transition: "all 0.2s" }}
                  >
                    {region.id}
                  </text>
                  
                  {/* Tooltip on hover */}
                  {isHovered && runs > 0 && (
                    <g>
                      <rect 
                        x={coords.x - 35} y={coords.y - dotSize - 30}
                        width="70" height="22" rx="6"
                        fill="#1e293b" opacity="0.9"
                      />
                      <text 
                        x={coords.x} y={coords.y - dotSize - 15}
                        textAnchor="middle" fill="white" fontSize="11"
                        fontWeight="bold"
                      >
                        {runs} run{runs !== 1 ? "s" : ""}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Center circle */}
            <circle cx={cx} cy={cy} r="8" fill="#0f172a" opacity="0.3" />
            
            {/* Direction indicator */}
            <text x={cx} y="20" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500">
              ▲ LEG SIDE
            </text>
            <text x={cx} y="488" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500">
              ▼ OFF SIDE
            </text>

            {/* STUMPS BAILS ANIMATION (BOWLED WICKET) */}
            {isBowledOrLbw && lastBall.wicketType === "Bowled" && (
              <g key={`bails-${lastBall.over}-${lastBall.ball}`}>
                {/* Left Bail flying and spinning */}
                <line x1={cx - 3} y1={pitchBottomY - 10} x2={cx} y2={pitchBottomY - 10} stroke="#fbbf24" strokeWidth="2.5" style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.3))" }}>
                  <animate attributeName="y1" from={pitchBottomY - 10} to={pitchBottomY - 45} dur="0.7s" begin="0.35s" fill="freeze" />
                  <animate attributeName="y2" from={pitchBottomY - 10} to={pitchBottomY - 55} dur="0.7s" begin="0.35s" fill="freeze" />
                  <animate attributeName="x1" from={cx - 3} to={cx - 16} dur="0.7s" begin="0.35s" fill="freeze" />
                  <animate attributeName="x2" from={cx} to={cx - 6} dur="0.7s" begin="0.35s" fill="freeze" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="0.7s" begin="0.35s" fill="freeze" />
                </line>
                {/* Right Bail flying and spinning */}
                <line x1={cx} y1={pitchBottomY - 10} x2={cx + 3} y2={pitchBottomY - 10} stroke="#fbbf24" strokeWidth="2.5" style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.3))" }}>
                  <animate attributeName="y1" from={pitchBottomY - 10} to={pitchBottomY - 52} dur="0.7s" begin="0.35s" fill="freeze" />
                  <animate attributeName="y2" from={pitchBottomY - 10} to={pitchBottomY - 42} dur="0.7s" begin="0.35s" fill="freeze" />
                  <animate attributeName="x1" from={cx} to={cx + 9} dur="0.7s" begin="0.35s" fill="freeze" />
                  <animate attributeName="x2" from={cx + 3} to={cx + 19} dur="0.7s" begin="0.35s" fill="freeze" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="0.7s" begin="0.35s" fill="freeze" />
                </line>
              </g>
            )}

            {/* 11 ANIMATED FIELDERS REACTING AND INTERCEPTING */}
            {resolvedFielders.map(f => {
              let targetX = f.x;
              let targetY = f.y;
              const isClosest = trajectoryDetails && f.id === trajectoryDetails.closestFielderId;

              if (trajectoryDetails && lastBall) {
                const runs = lastBall.runs || 0;
                const isBoundary = runs === 4 || runs === 6;
                if (isClosest) {
                  if (isBoundary) {
                    // Chase ball but stop 75% of the way (missed boundary!)
                    targetX = f.x + (trajectoryDetails.endX - f.x) * 0.75;
                    targetY = f.y + (trajectoryDetails.endY - f.y) * 0.75;
                  } else {
                    // Intercept ball exactly at landing coordinates!
                    targetX = trajectoryDetails.endX;
                    targetY = trajectoryDetails.endY;
                  }
                } else {
                  // Other fielders back up/shift 12% towards ball position
                  targetX = f.x + (trajectoryDetails.endX - f.x) * 0.12;
                  targetY = f.y + (trajectoryDetails.endY - f.y) * 0.12;
                }
              }

              const animKey = lastBall 
                ? `${lastBall.over}-${lastBall.ball}-${lastBall.runs}-${lastBall.wicket}-${f.id}`
                : `static-${f.id}`;

              return (
                <g key={f.id}>
                  {/* Fielder Glow Ring (for the running fielder) */}
                  {isClosest && lastBall && (
                    <circle cx={f.x} cy={f.y} r="8" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6">
                      <animate attributeName="cx" from={f.x} to={targetX} dur="0.8s" begin="0.4s" fill="freeze" />
                      <animate attributeName="cy" from={f.y} to={targetY} dur="0.8s" begin="0.4s" fill="freeze" />
                      <animate attributeName="r" values="8;13;8" dur="1s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Fielder Dot */}
                  <circle 
                    cx={f.x} 
                    cy={f.y} 
                    r="5.5" 
                    fill={isClosest ? "#3b82f6" : "#1e40af"} 
                    stroke="#ffffff" 
                    strokeWidth="1.5"
                    style={{ cursor: "pointer", transition: "all 0.2s" }}
                  >
                    {lastBall && (
                      <>
                        <animate 
                          key={`${animKey}-cx`}
                          attributeName="cx" 
                          from={f.x} 
                          to={targetX} 
                          dur="0.8s" 
                          begin="0.4s" 
                          fill="freeze" 
                        />
                        <animate 
                          key={`${animKey}-cy`}
                          attributeName="cy" 
                          from={f.y} 
                          to={targetY} 
                          dur="0.8s" 
                          begin="0.4s" 
                          fill="freeze" 
                        />
                      </>
                    )}
                  </circle>
                  
                  {/* Fielder Label */}
                  <text 
                    x={f.x} 
                    y={f.y - 8} 
                    textAnchor="middle" 
                    fill={isClosest ? "#1d4ed8" : "#475569"} 
                    fontSize="7.5" 
                    fontWeight={isClosest ? "bold" : "600"}
                    pointerEvents="none"
                    style={{ transition: "all 0.2s" }}
                  >
                    {f.name}
                    {lastBall && (
                      <>
                        <animate 
                          key={`${animKey}-tx`}
                          attributeName="x" 
                          from={f.x} 
                          to={targetX} 
                          dur="0.8s" 
                          begin="0.4s" 
                          fill="freeze" 
                        />
                        <animate 
                          key={`${animKey}-ty`}
                          attributeName="y" 
                          from={f.y - 8} 
                          to={targetY - 8} 
                          dur="0.8s" 
                          begin="0.4s" 
                          fill="freeze" 
                        />
                      </>
                    )}
                  </text>
                </g>
              );
            })}

            {/* TWO-PHASE LIVE BALL TRAJECTORY & SPARKS */}
            {trajectoryDetails && lastBall && (() => {
              const { bowlPath, shotPath, endX, endY, particles, badgeBg, badgeStroke, badgeColor, badgeText } = trajectoryDetails;
              const animKey = `${lastBall.over}-${lastBall.ball}-${lastBall.runs}-${lastBall.wicket}`;
              const isCaught = lastBall.wicket && lastBall.wicketType === "Caught";

              return (
                <g key={animKey}>
                  {/* Phase 1: Bowling Delivery (Bowler to Batsman) */}
                  <circle r="5.5" fill="url(#ballGlow)" stroke="#ffffff" strokeWidth="1" opacity="1">
                    <animateMotion dur="0.35s" repeatCount="1" path={bowlPath} fill="freeze" />
                    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.98;1" dur="0.35s" fill="freeze" />
                    <animate attributeName="r" values="5.5;9;5.5" dur="0.35s" fill="freeze" />
                  </circle>

                  {/* Contact Spark Flash (Batsman hits ball at 0.35s) */}
                  <circle cx="250" cy="310" r="0" fill="none" stroke="#fbbf24" strokeWidth="3" opacity="1">
                    <animate attributeName="r" from="0" to="22" dur="0.18s" begin="0.35s" fill="freeze" />
                    <animate attributeName="opacity" from="1" to="0" dur="0.18s" begin="0.35s" fill="freeze" />
                  </circle>

                  {/* Phase 2: Shot Trajectory and Fading Glowing Trail */}
                  {!isBowledOrLbw && (
                    <>
                      {/* Trail Line */}
                      <path 
                        d={shotPath} 
                        fill="none" 
                        stroke="url(#trailGrad)" 
                        strokeWidth="3.5" 
                        strokeDasharray="300" 
                        strokeDashoffset="300"
                      >
                        <animate attributeName="stroke-dashoffset" from="300" to="0" dur="0.8s" begin="0.35s" fill="freeze" />
                        <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="1.4s" begin="0.35s" fill="freeze" />
                      </path>

                      {/* Traveling Red Cricket Ball */}
                      <circle r="6" fill="url(#ballGlow)" stroke="#fbbf24" strokeWidth="1.5" opacity="0">
                        <animateMotion dur="0.8s" begin="0.35s" repeatCount="1" path={shotPath} fill="freeze" />
                        <animate attributeName="opacity" values="0;1;1" keyTimes="0;0.05;1" dur="0.8s" begin="0.35s" fill="freeze" />
                        {/* Scale arc representing altitude */}
                        <animate attributeName="r" values="6;12;6" dur="0.8s" begin="0.35s" fill="freeze" />
                        {/* Fade out on catch at fielder's hands */}
                        {isCaught && (
                          <animate attributeName="opacity" from="1" to="0" dur="0.08s" begin="1.15s" fill="freeze" />
                        )}
                      </circle>
                    </>
                  )}

                  {/* Impact Shockwave Ring (Ball lands in outfield at 1.15s) */}
                  <circle cx={endX} cy={endY} r="0" fill="none" stroke={lastBall.wicket ? "#ef4444" : "#fbbf24"} strokeWidth="3" opacity="0.9">
                    <animate attributeName="r" from="0" to="30" dur="0.45s" begin="1.15s" fill="freeze" />
                    <animate attributeName="opacity" from="0.9" to="0" dur="0.45s" begin="1.15s" fill="freeze" />
                  </circle>

                  {/* CELEBRATION CONFETTI / WICKET SHOCKWAVES (at 1.15s) */}
                  {particles.map((p) => {
                    const pEndX = endX + p.dx;
                    const pEndY = endY + p.dy;
                    return p.type === "circle" ? (
                      <circle key={p.id} cx={endX} cy={endY} r={p.size} fill={p.color} opacity="0">
                        <animate attributeName="cx" from={endX} to={pEndX} dur="1.1s" begin="1.15s" fill="freeze" />
                        <animate attributeName="cy" from={endY} to={pEndY} dur="1.1s" begin="1.15s" fill="freeze" />
                        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.75;1" dur="1.1s" begin="1.15s" fill="freeze" />
                        <animate attributeName="r" values={`${p.size};${p.size * 0.4}`} dur="1.1s" begin="1.15s" fill="freeze" />
                      </circle>
                    ) : (
                      <rect key={p.id} x={endX - p.size/2} y={endY - p.size/2} width={p.size} height={p.size} fill={p.color} opacity="0">
                        <animate attributeName="x" from={endX - p.size/2} to={pEndX - p.size/2} dur="1.1s" begin="1.15s" fill="freeze" />
                        <animate attributeName="y" from={endY - p.size/2} to={pEndY - p.size/2} dur="1.1s" begin="1.15s" fill="freeze" />
                        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.75;1" dur="1.1s" begin="1.15s" fill="freeze" />
                        <animateTransform attributeName="transform" type="rotate" from={`0 ${endX} ${endY}`} to={`360 ${pEndX} ${pEndY}`} dur="1.1s" begin="1.15s" fill="freeze" />
                      </rect>
                    );
                  })}

                  {/* FLOATING SCORE POPUP BADGE (at 1.15s) */}
                  <g opacity="0" style={{ filter: "drop-shadow(0px 3px 6px rgba(0,0,0,0.15))" }}>
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;1" dur="1.5s" begin="1.15s" fill="freeze" />
                    {/* Background badge pill */}
                    <rect 
                      x={endX - 32} y={endY - 12} width="64" height="22" rx="11" 
                      fill={badgeBg} stroke={badgeStroke} strokeWidth="1.5"
                    >
                      <animate attributeName="y" from={endY - 12} to={endY - 48} dur="1.5s" begin="1.15s" fill="freeze" />
                    </rect>
                    <text 
                      x={endX} y={endY + 3} textAnchor="middle" 
                      fill={badgeColor} fontSize="9" fontWeight="800"
                    >
                      <animate attributeName="y" from={endY + 3} to={endY - 33} dur="1.5s" begin="1.15s" fill="freeze" />
                      {badgeText}
                    </text>
                  </g>
                </g>
              );
            })()}
          </svg>
          
          {/* Hover info panel */}
          {hoveredRegion && (
            <div style={{
              position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)",
              background: "rgba(15,23,42,0.9)", color: "white",
              padding: "0.5rem 1rem", borderRadius: "8px",
              fontSize: "0.85rem", fontWeight: "500",
              whiteSpace: "nowrap", pointerEvents: "none",
              backdropFilter: "blur(4px)"
            }}>
              {hoveredRegion}: {aggregatedWagonWheel[hoveredRegion] || 0} runs scored
            </div>
          )}
        </div>

        {/* Stats Panel */}
        <div className="stadium-stats" style={{ flex: 1, minWidth: "200px" }}>
          <h4 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1rem", borderBottom: "2px solid #f1f5f9", paddingBottom: "0.5rem" }}>
            🎯 Shot Distribution
          </h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {FIELD_REGIONS.filter(r => (aggregatedWagonWheel[r.id] || 0) > 0)
              .sort((a, b) => (aggregatedWagonWheel[b.id] || 0) - (aggregatedWagonWheel[a.id] || 0))
              .slice(0, 8)
              .map((region, i) => {
                const runs = aggregatedWagonWheel[region.id] || 0;
                const pct = totalRuns > 0 ? (runs / totalRuns) * 100 : 0;
                
                return (
                  <div key={region.id} className="shot-region-bar" style={{
                    display: "flex", alignItems: "center", gap: "8px"
                  }}>
                    <span style={{ color: "#64748b", fontSize: "0.85rem", minWidth: "100px", textAlign: "right" }}>
                      {region.id}
                    </span>
                    <div style={{
                      flex: 1, height: "20px", background: "#f1f5f9", borderRadius: "10px",
                      overflow: "hidden", position: "relative"
                    }}>
                      <div style={{
                        width: `${pct}%`, height: "100%",
                        background: `linear-gradient(90deg, #facc15, #f97316, #dc2626)`,
                        borderRadius: "10px",
                        transition: "width 0.5s ease-in-out",
                        display: "flex", alignItems: "center", justifyContent: "flex-end",
                        paddingRight: pct > 15 ? "8px" : "0"
                      }}>
                        {pct > 15 && (
                          <span style={{ color: "white", fontSize: "0.7rem", fontWeight: "bold" }}>
                            {Math.round(pct)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontWeight: "bold", color: "#0f172a", minWidth: "30px", fontSize: "0.9rem" }}>
                      {runs}
                    </span>
                  </div>
                );
              })}
            
            {Object.keys(aggregatedWagonWheel).length === 0 && (
              <p className="empty-state" style={{ textAlign: "center", padding: "1rem" }}>
                No shot data recorded yet. Runs scored when a shot region is selected will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}