import React, { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function TournamentBracket({ tournament }) {
  if (!tournament) return null;

  const { matches = [], name, stage, format } = tournament;

  // Separate matches by stage
  const isKnockoutPhase = stage === "semi" || stage === "final" || stage === "knockout" || format === "knockout" || format === "league+knockout";
  
  if (!isKnockoutPhase || matches.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
        <p style={{ margin: 0 }}>This tournament is currently in the Group Stage. Brackets will generate once teams qualify for the Knockout Stage.</p>
      </div>
    );
  }

  // Group matches into rounds
  const rounds = groupIntoRounds(matches);
  
  if (rounds.length === 0) return null;

  // Zoom & Pan State
  const [scale, setScale] = useState(1.0);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredMatch, setHoveredMatch] = useState(null); // { roundIndex, matchIndex, matchId }
  const [selectedMatch, setSelectedMatch] = useState(null);
  const reduceMotion = useReducedMotion();

  const canvasRef = useRef(null);

  // Zoom Handlers
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.6));
  const handleZoomReset = () => {
    setScale(1.0);
    setTranslate({ x: 0, y: 0 });
  };

  // Drag Handlers
  const handleMouseDown = (e) => {
    // Only drag on left click and when clicking on the container background, not on buttons or cards
    if (e.button !== 0) return;
    if (e.target.closest(".match-card") || e.target.closest(".zoom-btn")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Path Highlights
  // Trace connection: Match m in Round r is connected to hovered match (hr, hm)
  const isConnectedToHovered = (r, m) => {
    if (!hoveredMatch) return false;
    const { roundIndex: hr, matchIndex: hm } = hoveredMatch;
    
    if (r === hr) {
      return m === hm;
    }
    
    if (r < hr) {
      // Previous rounds: check if (r, m) feeds into (hr, hm)
      const diff = hr - r;
      return Math.floor(m / Math.pow(2, diff)) === hm;
    } else {
      // Subsequent rounds: check if (hr, hm) feeds into (r, m)
      const diff = r - hr;
      return Math.floor(hm / Math.pow(2, diff)) === m;
    }
  };

  // Extract MVP stats from match
  const getMatchMVPs = (match) => {
    if (!match) return { batsman: null, bowler: null };
    
    let topBatsman = null;
    let topBowler = null;

    // Check first innings stats
    const parseInningsStats = (statsObj) => {
      if (!statsObj) return;
      
      // Parse Batting
      if (statsObj.battingStats) {
        Object.entries(statsObj.battingStats).forEach(([name, stats]) => {
          const runs = stats.runs || 0;
          const balls = stats.balls || 0;
          const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;
          
          if (!topBatsman || runs > topBatsman.runs || (runs === topBatsman.runs && strikeRate > topBatsman.strikeRate)) {
            topBatsman = { name, runs, balls, strikeRate, fours: stats.fours || 0, sixes: stats.sixes || 0 };
          }
        });
      }

      // Parse Bowling
      if (statsObj.bowlingStats) {
        Object.entries(statsObj.bowlingStats).forEach(([name, stats]) => {
          const wickets = stats.wickets || 0;
          const runs = stats.runs || 0;
          const balls = stats.balls || 0;
          const economy = balls > 0 ? (runs / (balls / 6)) : 0;

          if (!topBowler || wickets > topBowler.wickets || (wickets === topBowler.wickets && runs < topBowler.runs)) {
            topBowler = { name, wickets, runs, overs: `${Math.floor(balls/6)}.${balls%6}`, economy };
          }
        });
      }
    };

    if (match.firstInnings) parseInningsStats(match.firstInnings);
    parseInningsStats(match); // current innings

    return { batsman: topBatsman, bowler: topBowler };
  };

  const { batsman: mvpBatsman, bowler: mvpBowler } = getMatchMVPs(selectedMatch);

  return (
    <motion.div className="tournament-bracket-container" style={{
      background: "linear-gradient(135deg, #0b0f19 0%, #111827 100%)",
      borderRadius: "16px",
      padding: "2rem",
      marginBottom: "2rem",
      overflow: "hidden",
      position: "relative",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
      userSelect: "none"
    }}>
      <style>{`
        .bracket-canvas {
          cursor: grab;
        }
        .bracket-canvas:active {
          cursor: grabbing;
        }
        .match-card {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .match-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4), 0 0 12px rgba(14, 165, 233, 0.2);
          border-color: rgba(14, 165, 233, 0.4) !important;
        }
        .zoom-btn {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: bold;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .zoom-btn:hover {
          background: rgba(14, 165, 233, 0.2);
          border-color: rgba(14, 165, 233, 0.4);
          color: #38bdf8;
        }
        .bracket-connector-pipe {
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .modal-overlay {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .modal-card {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Background decoration */}
      <div style={{
        position: "absolute", top: "-30%", right: "-10%",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)",
        borderRadius: "50%",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "2rem", paddingBottom: "1rem",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "relative", zIndex: 10
      }}>
        <div>
          <p style={{ margin: 0, color: "#ea580c", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Tournament Standings
          </p>
          <h2 style={{ margin: "0.25rem 0 0 0", color: "white", fontSize: "1.6rem", fontWeight: 800 }}>
            🏆 {name} — Knockout Bracket
          </h2>
        </div>

        {/* Zoom and Reset Controls */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">-</button>
          <span style={{ color: "#64748b", fontSize: "0.85rem", minWidth: "45px", textAlign: "center", fontWeight: 600 }}>
            {Math.round(scale * 100)}%
          </span>
          <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
          <button className="zoom-btn" onClick={handleZoomReset} title="Reset Bracket Layout" style={{ fontSize: "0.95rem" }}>↺</button>
        </div>
      </div>

      {/* Bracket Canvas Area (Draggable) */}
      <div 
        className="bracket-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: "100%",
          overflow: "hidden",
          borderRadius: "12px",
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255,255,255,0.03)",
          minHeight: rounds.length <= 2 ? "320px" : "540px",
          position: "relative",
          cursor: isDragging ? "grabbing" : "grab"
        }}
      >
        <div 
          ref={canvasRef}
          style={{
            display: "flex",
            gap: "4.5rem",
            justifyContent: "center",
            alignItems: "stretch",
            padding: "3rem 2rem",
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
            width: "fit-content",
            margin: "0 auto",
            minWidth: "100%"
          }}
        >
          {rounds.map((round, roundIndex) => {
            const isLastRound = roundIndex === rounds.length - 1;
            const roundMatchesCount = round.matches.length;
            
            return (
              <div 
                key={roundIndex} 
                className="bracket-round" 
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-around",
                  minWidth: "240px",
                  position: "relative"
                }}
              >
                {/* Round Label */}
                <div style={{
                  textAlign: "center", 
                  marginBottom: "1.5rem",
                  color: "#94a3b8", 
                  fontSize: "0.85rem",
                  fontWeight: 800, 
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background: "rgba(255,255,255,0.03)",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}>
                  {round.label}
                </div>

                {/* Matches */}
                {round.matches.map((match, matchIndex) => {
                  const isCompleted = match.status === "completed";
                  const isBye = match.teamB === "BYE";
                  const matchId = match._id || `m-${roundIndex}-${matchIndex}`;
                  
                  // Check if this card or its path is hovered
                  const isHighlighted = isConnectedToHovered(roundIndex, matchIndex);
                  const isHovered = hoveredMatch && hoveredMatch.roundIndex === roundIndex && hoveredMatch.matchIndex === matchIndex;

                  return (
                    <div 
                      key={matchIndex} 
                      className="bracket-match" 
                      style={{
                        position: "relative",
                        margin: roundMatchesCount > 1 ? "1.5rem 0" : "0",
                        flex: rounds.length > 2 ? 1 : "0 1 auto",
                        display: "flex",
                        alignItems: "center"
                      }}
                      onMouseEnter={() => setHoveredMatch({ roundIndex, matchIndex, matchId })}
                      onMouseLeave={() => setHoveredMatch(null)}
                    >
                      {/* CSS-Based Curved Bent-Pipe Connector (Horizontal + Vertical Bends) */}
                      {!isLastRound && (
                        <div 
                          className="bracket-connector-pipe"
                          style={{
                            position: "absolute",
                            right: "-4.5rem",
                            width: "4.5rem",
                            // Height of pipe is exactly half of the vertical spacing (which is 100% / 2N)
                            height: `calc(100% / ${roundMatchesCount * 2} + 12px)`,
                            zIndex: 0,
                            pointerEvents: "none",
                            // Even indices bend DOWN, Odd indices bend UP
                            top: matchIndex % 2 === 0 ? "50%" : "auto",
                            bottom: matchIndex % 2 === 1 ? "50%" : "auto",
                            // Draw pipes using borders
                            borderRight: `3px solid ${
                              isHighlighted 
                                ? "#0ea5e9" 
                                : isCompleted && match.winner !== "BYE" 
                                  ? "rgba(34, 197, 94, 0.4)" 
                                  : "rgba(148, 163, 184, 0.15)"
                            }`,
                            borderBottom: matchIndex % 2 === 0 ? `3px solid ${
                              isHighlighted 
                                ? "#0ea5e9" 
                                : isCompleted && match.winner !== "BYE" 
                                  ? "rgba(34, 197, 94, 0.4)" 
                                  : "rgba(148, 163, 184, 0.15)"
                            }` : "none",
                            borderTop: matchIndex % 2 === 1 ? `3px solid ${
                              isHighlighted 
                                ? "#0ea5e9" 
                                : isCompleted && match.winner !== "BYE" 
                                  ? "rgba(34, 197, 94, 0.4)" 
                                  : "rgba(148, 163, 184, 0.15)"
                            }` : "none",
                            borderBottomRightRadius: matchIndex % 2 === 0 ? "10px" : "0",
                            borderTopRightRadius: matchIndex % 2 === 1 ? "10px" : "0",
                            boxShadow: isHighlighted ? "0 0 10px rgba(14, 165, 233, 0.3)" : "none"
                          }}
                        >
                          {/* Anchor dot on target connection */}
                          {matchIndex % 2 === 0 && (
                            <div style={{
                              position: "absolute",
                              right: "-4px",
                              bottom: "-4px",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: isHighlighted ? "#0ea5e9" : isCompleted ? "#22c55e" : "#475569",
                              boxShadow: isHighlighted ? "0 0 8px #0ea5e9" : "none"
                            }} />
                          )}
                        </div>
                      )}

                      {/* Match Card Body */}
                      <motion.div 
                        className="match-card" 
                        onClick={() => setSelectedMatch(match)}
                        style={{
                          background: isCompleted 
                            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(17, 24, 39, 0.8) 100%)"
                            : "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(17, 24, 39, 0.9) 100%)",
                          border: `1px solid ${
                            isHovered 
                              ? "#0ea5e9" 
                              : isHighlighted 
                                ? "rgba(14, 165, 233, 0.4)"
                                : isCompleted 
                                  ? "rgba(34, 197, 94, 0.25)" 
                                  : "rgba(255,255,255,0.08)"
                          }`,
                          borderRadius: "14px",
                          padding: "1.1rem 1.25rem",
                          backdropFilter: "blur(12px)",
                          cursor: "pointer",
                          position: "relative",
                          zIndex: 2,
                          minWidth: "220px",
                          boxShadow: isHovered 
                            ? "0 15px 35px rgba(0, 0, 0, 0.5), 0 0 15px rgba(14, 165, 233, 0.25)"
                            : "0 4px 15px rgba(0,0,0,0.2)"
                        }}
                        initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: matchIndex * 0.1 }}
                        whileHover={reduceMotion ? {} : { scale: 1.03, boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}
                      >
                        {/* Team A */}
                        <div className="match-team" style={{
                          display: "flex", justifyContent: "space-between",
                          alignItems: "center", padding: "0.35rem 0",
                          opacity: isBye ? 0.4 : 1
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              width: "26px", height: "26px", borderRadius: "8px",
                              background: `linear-gradient(135deg, #003a6c, #0ea5e9)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.7rem", fontWeight: "900", color: "white",
                              flexShrink: 0,
                              boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
                            }}>
                              {match.teamA?.substring(0, 2).toUpperCase()}
                            </div>
                            <span style={{
                              color: match.winner === match.teamA ? "#22c55e" : "#f1f5f9",
                              fontWeight: match.winner === match.teamA ? 800 : 500,
                              fontSize: "0.95rem"
                            }}>
                              {match.teamA}
                            </span>
                          </div>
                          {isCompleted && (
                            <span style={{
                              fontWeight: 800, fontSize: "1rem",
                              color: match.winner === match.teamA ? "#22c55e" : "#64748b"
                            }}>
                              {match.runsA ?? 0}/{match.wicketsA ?? 0}
                            </span>
                          )}
                        </div>

                        {/* VS Divider */}
                        {!isBye && (
                          <div style={{
                            display: "flex", justifyContent: "center", alignItems: "center",
                            margin: "0.2rem 0", gap: "10px"
                          }}>
                            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                            <span style={{
                              color: "rgba(255,255,255,0.2)", fontSize: "0.65rem", fontWeight: 800,
                              background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "10px",
                              border: "1px solid rgba(255,255,255,0.03)"
                            }}>
                              {isCompleted ? "FT" : "VS"}
                            </span>
                            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                          </div>
                        )}

                        {/* Team B */}
                        {!isBye && (
                          <div className="match-team" style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", padding: "0.35rem 0"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{
                                width: "26px", height: "26px", borderRadius: "8px",
                                background: `linear-gradient(135deg, #ea580c, #f97316)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.7rem", fontWeight: "900", color: "white",
                                flexShrink: 0,
                                boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
                              }}>
                                {match.teamB?.substring(0, 2).toUpperCase()}
                              </div>
                              <span style={{
                                color: match.winner === match.teamB ? "#22c55e" : "#f1f5f9",
                                fontWeight: match.winner === match.teamB ? 800 : 500,
                                fontSize: "0.95rem"
                              }}>
                                {match.teamB}
                              </span>
                            </div>
                            {isCompleted && (
                              <span style={{
                                fontWeight: 800, fontSize: "1rem",
                                color: match.winner === match.teamB ? "#22c55e" : "#64748b"
                              }}>
                                {match.runsB ?? 0}/{match.wicketsB ?? 0}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bye Indicator */}
                        {isBye && (
                          <div style={{
                            textAlign: "center", color: "#fb923c",
                            fontSize: "0.75rem", padding: "0.35rem 0",
                            fontStyle: "italic", fontWeight: 600,
                            background: "rgba(234, 88, 12, 0.1)",
                            borderRadius: "6px",
                            marginTop: "0.5rem"
                          }}>
                            ⚡ BYE — Auto-advances
                          </div>
                        )}

                        {/* Winner/Crown Indicator */}
                        {isCompleted && match.winner && match.winner !== "BYE" && (
                          <div style={{
                            marginTop: "0.6rem", paddingTop: "0.6rem",
                            borderTop: "1px solid rgba(34, 197, 94, 0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}>
                            <span style={{ fontSize: "0.9rem" }}>👑</span>
                            <span style={{
                              color: "#22c55e", fontSize: "0.75rem",
                              fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em"
                            }}>
                              {match.winner} wins
                            </span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Match Details MVP Statistics Modal (Frosted Overlay) */}
      {selectedMatch && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedMatch(null)}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(8, 12, 21, 0.75)",
            backdropFilter: "blur(12px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem"
          }}
        >
          <div 
            className="modal-card"
            onClick={(e) => e.stopPropagation()} // prevent overlay close click inside
            style={{
              background: "linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.9) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "20px",
              padding: "2rem",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              position: "relative",
              color: "white"
            }}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedMatch(null)}
              style={{
                position: "absolute", top: "1.25rem", right: "1.25rem",
                background: "rgba(255,255,255,0.05)", border: "none",
                borderRadius: "50%", width: "32px", height: "32px",
                color: "#94a3b8", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.target.style.background = "rgba(239, 68, 68, 0.2)"; e.target.style.color = "white"; }}
              onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.05)"; e.target.style.color = "#94a3b8"; }}
            >
              ×
            </button>

            {/* Modal Title */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ margin: 0, color: "#0ea5e9", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Match Center Overview
              </p>
              <h3 style={{ margin: "0.2rem 0 0 0", fontSize: "1.35rem", fontWeight: 800 }}>
                📊 Detailed Match Statistics
              </h3>
            </div>

            {/* Core Score Display */}
            <div style={{
              background: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.03)",
              borderRadius: "14px",
              padding: "1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              {/* Team A */}
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #003a6c, #0ea5e9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.1rem", fontWeight: "900", margin: "0 auto 0.5rem"
                }}>
                  {selectedMatch.teamA?.substring(0, 2).toUpperCase()}
                </div>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700" }}>{selectedMatch.teamA}</h4>
                {selectedMatch.status === "completed" && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "1.4rem", fontWeight: "900", color: selectedMatch.winner === selectedMatch.teamA ? "#22c55e" : "#94a3b8" }}>
                    {selectedMatch.runsA ?? 0}/{selectedMatch.wicketsA ?? 0}
                  </p>
                )}
              </div>

              {/* VS Divider */}
              <div style={{ textAlign: "center", padding: "0 1rem" }}>
                <span style={{
                  fontSize: "0.8rem", color: "#fb923c", fontWeight: "bold",
                  background: "rgba(234, 88, 12, 0.15)", padding: "4px 10px", borderRadius: "20px",
                  border: "1px solid rgba(234,88,12,0.3)"
                }}>
                  {selectedMatch.status?.toUpperCase() || 'PENDING'}
                </span>
                <p style={{ margin: "6px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                  {selectedMatch.oversA ? `Max ${selectedMatch.oversA} ov` : ""}
                </p>
              </div>

              {/* Team B */}
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #ea580c, #f97316)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.1rem", fontWeight: "900", margin: "0 auto 0.5rem"
                }}>
                  {selectedMatch.teamB?.substring(0, 2).toUpperCase()}
                </div>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700" }}>{selectedMatch.teamB}</h4>
                {selectedMatch.status === "completed" && selectedMatch.teamB !== "BYE" && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "1.4rem", fontWeight: "900", color: selectedMatch.winner === selectedMatch.teamB ? "#22c55e" : "#94a3b8" }}>
                    {selectedMatch.runsB ?? 0}/{selectedMatch.wicketsB ?? 0}
                  </p>
                )}
              </div>
            </div>

            {/* MVP Awards Section */}
            {selectedMatch.status === "completed" && selectedMatch.teamB !== "BYE" && (mvpBatsman || mvpBowler) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#f8fafc", fontSize: "0.95rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                  🌟 Match MVP Honors
                </h4>
                
                {/* Batting MVP */}
                {mvpBatsman && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    background: "rgba(14, 165, 233, 0.08)",
                    border: "1px solid rgba(14, 165, 233, 0.15)",
                    borderRadius: "12px", padding: "0.85rem 1rem"
                  }}>
                    <div style={{ fontSize: "2rem" }}>🏏</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "0.7rem", color: "#38bdf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Top Batsman</span>
                      <h5 style={{ margin: "2px 0 0 0", fontSize: "1.05rem", color: "#f1f5f9", fontWeight: 700 }}>{mvpBatsman.name}</h5>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1.25rem", fontWeight: "900", color: "#38bdf8" }}>{mvpBatsman.runs}</span>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}> ({mvpBatsman.balls}b)</span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.7rem", color: "#64748b" }}>SR: {mvpBatsman.strikeRate.toFixed(1)}</p>
                    </div>
                  </div>
                )}

                {/* Bowling MVP */}
                {mvpBowler && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    background: "rgba(168, 85, 247, 0.08)",
                    border: "1px solid rgba(168, 85, 247, 0.15)",
                    borderRadius: "12px", padding: "0.85rem 1rem"
                  }}>
                    <div style={{ fontSize: "2rem" }}>🔴</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "0.7rem", color: "#c084fc", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Top Bowler</span>
                      <h5 style={{ margin: "2px 0 0 0", fontSize: "1.05rem", color: "#f1f5f9", fontWeight: 700 }}>{mvpBowler.name}</h5>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1.25rem", fontWeight: "900", color: "#c084fc" }}>{mvpBowler.wickets} Wkts</span>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>{mvpBowler.runs} runs conceded ({mvpBowler.overs} ov)</p>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedMatch.status === "completed" && selectedMatch.winner ? (
              <div style={{
                textAlign: "center", padding: "1.5rem", borderRadius: "12px",
                background: "rgba(34, 197, 94, 0.06)", border: "1px solid rgba(34, 197, 94, 0.15)",
                color: "#22c55e", fontWeight: "600", fontSize: "0.95rem"
              }}>
                🏅 Match completed! <strong>{selectedMatch.winner}</strong> advanced to the next round. Detailed MVP metrics will compile when full scorecard data is saved.
              </div>
            ) : (
              <div style={{
                textAlign: "center", padding: "1.5rem", borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)",
                color: "#64748b", fontStyle: "italic", fontSize: "0.9rem"
              }}>
                🕒 This match has not started yet. Visit the Live tab once active to score the match.
              </div>
            )}

            {/* Action Footer */}
            <button 
              className="button secondary"
              onClick={() => setSelectedMatch(null)}
              style={{
                width: "100%", marginTop: "1.5rem", padding: "0.75rem",
                borderRadius: "10px", fontWeight: "bold", cursor: "pointer",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "white", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.05)"}
            >
              Close Match Overview
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );
}

// Helper: Group knockout matches into rounds dynamically
function groupIntoRounds(matches) {
  if (matches.length === 0) return [];
  
  const completed = matches.filter(m => m.status === "completed" && m.winner && m.winner !== "BYE");
  
  // If it's a final
  if (matches.length === 1) {
    return [{ label: "Final Match", matches }];
  }
  
  // If it's semis + final
  if (matches.length <= 3) {
    const finalMatch = matches.find(m => 
      m.status === "completed" || matches.indexOf(m) === matches.length - 1
    );
    const otherMatches = matches.filter(m => m !== finalMatch);
    
    const rounds = [];
    if (otherMatches.length > 0) {
      rounds.push({ label: "Semi-Finals", matches: otherMatches });
    }
    if (finalMatch) {
      rounds.push({ label: "Championship Final", matches: [finalMatch] });
    }
    return rounds;
  }
  
  // Generic grouping into rounds (Quarter-Finals, Semi-Finals, Final)
  const totalRounds = Math.ceil(Math.log2(matches.length + 1));
  const roundSize = Math.pow(2, totalRounds - 1);
  
  const rounds = [];
  let remaining = [...matches];
  
  for (let r = 0; r < totalRounds && remaining.length > 0; r++) {
    const count = Math.min(roundSize / Math.pow(2, r), remaining.length);
    const roundMatches = remaining.splice(0, count);
    
    const labels = ["Quarter-Finals", "Semi-Finals", "Championship Final"];
    const label = r < labels.length ? labels[r] : `Round ${r + 1}`;
    
    rounds.push({ label, matches: roundMatches });
  }
  
  return rounds;
}