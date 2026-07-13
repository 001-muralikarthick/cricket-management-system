import React, { useState, useEffect } from "react";
import API from "../api";

function formatOvers(totalBalls) {
  return `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
}

export default function PastMatches({ onViewMatch, onResumeMatch }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await API.get("/matches");
        // Sort newest first
        const sorted = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setMatches(sorted);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  async function handleDelete(matchId) {
    if (window.confirm("Are you sure you want to delete this in-progress match?")) {
      try {
        await API.delete(`/matches/${matchId}`);
        setMatches((prev) => prev.filter((m) => m._id !== matchId));
      } catch (err) {
        console.error("Failed to delete match:", err);
        alert("Failed to delete match. Ensure backend is running.");
      }
    }
  }

  const handleDownloadPdf = (id) => {
    if (!id) return;
    window.open(`${API.defaults.baseURL}/matches/${id}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="panel">
        <p className="empty-state">Loading matches...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2>Past Matches</h2>
        </div>
        <p className="empty-state">No matches found.</p>
      </div>
    );
  }

  return (
    <section className="panel ch-card">
      <div className="panel-head">
        <div>
          <p className="label">History</p>
          <h2>Past Matches</h2>
        </div>
        <p className="hint">View results of all your previously played matches.</p>
      </div>

      <div className="team-grid" style={{ gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {matches.map((match) => {
          const firstInnsRuns = match.firstInnings
            ? match.firstInnings.runs
            : match.innings === 1
            ? match.runs
            : 0;
          const firstInnsWickets = match.firstInnings
            ? match.firstInnings.wickets
            : match.innings === 1
            ? match.wickets
            : 0;
          const firstInnsBalls = match.firstInnings
            ? match.firstInnings.balls
            : match.innings === 1
            ? match.balls
            : 0;

          const secondInnsRuns = match.innings === 2 ? match.runs : 0;
          const secondInnsWickets = match.innings === 2 ? match.wickets : 0;
          const secondInnsBalls = match.innings === 2 ? match.balls : 0;
          const hasSecondInnsStarted = match.innings === 2 || match.needsSecondInningsSetup;

          return (
            <div
              key={match._id}
              className="team-card"
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  className="team-tag"
                  style={{
                    background: match.matchResult ? "#dcfce7" : "#fef08a",
                    color: match.matchResult ? "#166534" : "#854d0e",
                  }}
                >
                  {match.matchResult ? "Completed" : "In Progress"}
                </span>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {new Date(match.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3
                style={{
                  margin: "0",
                  fontSize: "1.25rem",
                  color: "#0f172a",
                  fontWeight: "600",
                }}
              >
                {match.teamA} vs {match.teamB}
              </h3>
              <p style={{ margin: "0", fontSize: "0.9rem", color: "#64748b" }}>
                {match.totalOvers} Overs Match
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  background: "#f8fafc",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <div>
                  <strong style={{ color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                    {match.teamA}
                  </strong>
                  <p style={{ margin: "0", fontSize: "1.25rem", fontWeight: "bold", color: "#0f172a" }}>
                    {firstInnsRuns}/{firstInnsWickets}
                    <span
                      style={{
                        fontSize: "0.9rem",
                        color: "#64748b",
                        marginLeft: "0.5rem",
                        fontWeight: "normal",
                      }}
                    >
                      ({formatOvers(firstInnsBalls)})
                    </span>
                  </p>
                </div>

                <div>
                  <strong style={{ color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                    {match.teamB}
                  </strong>
                  <p style={{ margin: "0", fontSize: "1.25rem", fontWeight: "bold", color: "#0f172a" }}>
                    {hasSecondInnsStarted ? (
                      <>
                        {secondInnsRuns}/{secondInnsWickets}
                        <span
                          style={{
                            fontSize: "0.9rem",
                            color: "#64748b",
                            marginLeft: "0.5rem",
                            fontWeight: "normal",
                          }}
                        >
                          ({formatOvers(secondInnsBalls)})
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: "1rem", fontWeight: "normal", color: "#94a3b8" }}>
                        Yet to bat
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {match.matchResult && (
                <div
                  style={{
                    fontWeight: "600",
                    color: "#0284c7",
                    background: "#e0f2fe",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    display: "inline-block",
                    alignSelf: "flex-start"
                  }}
                >
                  {match.matchResult}
                </div>
              )}
              
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                <button 
                  className="button secondary" 
                  onClick={() => onViewMatch && onViewMatch(match._id)}
                >
                  View Scoreboard
                </button>
                {match.matchResult && (
                  <button 
                    className="button secondary" 
                    onClick={() => handleDownloadPdf(match._id)}
                  >
                    Download PDF
                  </button>
                )}
                {!match.matchResult && (
                  <button
                    className="button danger"
                    onClick={() => handleDelete(match._id)}
                  >
                    Delete Match
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
