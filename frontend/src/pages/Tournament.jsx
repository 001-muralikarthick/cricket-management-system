import React, { useEffect, useState } from "react";
import API from "../api";
import TournamentBracket from "./TournamentBracket";

function Tournament({ teams = [], onTournamentCreated, onStartMatch, onStartLiveMatch, onResumeMatch, allPlayers = [] }) {
  const [tournaments, setTournaments] = useState([]);
  const [name, setName] = useState("");
  const [format, setFormat] = useState("league");
  const [matchType, setMatchType] = useState("limited-overs");
  const [oversPerMatch, setOversPerMatch] = useState(10);
  const [durationDays, setDurationDays] = useState(1);
  const [minPointsToQualify, setMinPointsToQualify] = useState(0);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [activeTab, setActiveTab] = useState("create");
  
  const [addingMatchTo, setAddingMatchTo] = useState(null);
  const [newMatchTeamA, setNewMatchTeamA] = useState("");
  const [newMatchTeamB, setNewMatchTeamB] = useState("");
  const [matchAddedFeedback, setMatchAddedFeedback] = useState("");

  const [selectedTournament, setSelectedTournament] = useState("");
  const [quickTeamA, setQuickTeamA] = useState("");
  const [quickTeamB, setQuickTeamB] = useState("");
  const [quickOvers, setQuickOvers] = useState(10);
  const [quickStriker, setQuickStriker] = useState("");
  const [quickNonStriker, setQuickNonStriker] = useState("");
  const [quickBowler, setQuickBowler] = useState("");

  const [startingMatchId, setStartingMatchId] = useState(null);
  const [startOvers, setStartOvers] = useState(10);
  const [startStriker, setStartStriker] = useState("");
  const [startNonStriker, setStartNonStriker] = useState("");
  const [startBowler, setStartBowler] = useState("");

  const getPlayers = (teamName) => {
    const t = teams.find(team => team.name === teamName);
    return t?.players?.length ? t.players : ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"];
  };

  const quickBattingPlayers = getPlayers(quickTeamA);
  const quickBowlingPlayers = getPlayers(quickTeamB);
  const maxOversPerBowler = Math.ceil(Number(quickOvers || 1) / 5);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  function toggleTeamSelection(teamName) {
    if (selectedTeams.includes(teamName)) {
      setSelectedTeams(selectedTeams.filter((t) => t !== teamName));
    } else {
      setSelectedTeams([...selectedTeams, teamName]);
    }
  }

  async function createTournament() {
    if (!name.trim() || selectedTeams.length < 2) return;

    const initialPointsTable = selectedTeams.map(teamName => ({
      team: teamName,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      qualified: false
    }));

    try {
      await API.post("/tournaments", {
        name,
        format,
        matchType,
        oversPerMatch,
        durationDays,
        minPointsToQualify,
        groups: [
          {
            name: "Group A",
            teams: selectedTeams,
            pointsTable: initialPointsTable
          }
        ],
        matches: []
      });

      setName("");
      setFormat("league");
      setMatchType("limited-overs");
      setOversPerMatch(10);
      setDurationDays(1);
      setMinPointsToQualify(0);
      setSelectedTeams([]);
      fetchData();
      if (onTournamentCreated) onTournamentCreated();
      setActiveTab("list");
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleQualifyStatus(tournamentId, teamName, currentStatus) {
    try {
      await API.put(`/tournaments/${tournamentId}/qualify`, {
        teamName,
        qualified: !currentStatus
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function generateMatches(id) {
    try {
      await API.post("/tournaments/generate", { tournamentId: id });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function advanceKnockout(id) {
    try {
      await API.post("/tournaments/advance", { tournamentId: id });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteTournament(id) {
    try {
      await API.delete(`/tournaments/${id}`);
      fetchData();
      if (onTournamentCreated) onTournamentCreated();
    } catch (err) {
      console.error(err);
    }
  }

  async function addManualMatch(tournamentId) {
    if (!newMatchTeamA || !newMatchTeamB || newMatchTeamA === newMatchTeamB) return;
    try {
      await API.post(`/tournaments/${tournamentId}/matches`, {
        teamA: newMatchTeamA,
        teamB: newMatchTeamB
      });
      setMatchAddedFeedback(`Successfully added: ${newMatchTeamA} vs ${newMatchTeamB}`);
      setNewMatchTeamA("");
      setNewMatchTeamB("");
      fetchData();
      setTimeout(() => setMatchAddedFeedback(""), 4000);
    } catch (err) {
      console.error(err);
      setMatchAddedFeedback("Failed to add match. Please try again.");
    }
  }

  async function simulateMatchResult(tournamentId, matchId, winner, teamA, teamB) {
    try {
      await API.put("/tournaments/result", {
        tournamentId,
        matchId,
        winner,
        runsA: 0,
        runsB: 0
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <section className="panel ch-card" style={{ marginBottom: "2rem" }}>
      <div className="panel-head" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div>
          <p className="label" style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>🏏 TOURNAMENT CENTER</p>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Manage Your Tournaments</h2>
          <p className="hint" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Create tournaments, organize matches, and track standings all in one place.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab("create")}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === "create" ? '3px solid #003a6c' : '3px solid transparent',
            color: activeTab === "create" ? '#003a6c' : '#64748b',
            fontWeight: activeTab === "create" ? '600' : '500',
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          ⚡ Quick Match
        </button>
        <button
          onClick={() => setActiveTab("list")}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === "list" ? '3px solid #003a6c' : '3px solid transparent',
            color: activeTab === "list" ? '#003a6c' : '#64748b',
            fontWeight: activeTab === "list" ? '600' : '500',
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          🏆 My Tournaments ({tournaments.length})
        </button>
      </div>

      {activeTab === "create" && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Quick Match Card */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-md)', border: '2px solid var(--cricket-blue-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid var(--border-light)' }}>
              <div style={{ fontSize: '2.5rem' }}>⚡</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Quick Match</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start playing in seconds</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>TOURNAMENT</label>
                <select className="input" value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)} style={{ fontSize: '0.9rem' }}>
                  <option value="">No Tournament (Friendly)</option>
                  {tournaments.map((t) => (
                    <option key={t._id || t.name} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>BATTING TEAM</label>
                  <select className="input" value={quickTeamA} onChange={(e) => {
                    const newTeamA = e.target.value;
                    setQuickTeamA(newTeamA);
                    const team = teams.find(t => t.name === newTeamA);
                    if (team?.players?.length) {
                      setQuickStriker(team.players[0]);
                      setQuickNonStriker(team.players[1] || team.players[0]);
                    }
                  }} style={{ fontSize: '0.9rem' }}>
                    <option value="">Select team</option>
                    {teams.filter(t => t.players && t.players.length > 0).map((team) => (
                      <option key={team._id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>BOWLING TEAM</label>
                  <select className="input" value={quickTeamB} onChange={(e) => {
                    const newTeamB = e.target.value;
                    setQuickTeamB(newTeamB);
                    const team = teams.find(t => t.name === newTeamB);
                    if (team?.players?.length) {
                      setQuickBowler(team.players[0]);
                    }
                  }} style={{ fontSize: '0.9rem' }}>
                    <option value="">Select team</option>
                    {teams.filter(t => t.players && t.players.length > 0).map((team) => (
                      <option key={team._id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>OVERS</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="50"
                    value={quickOvers}
                    onChange={(e) => setQuickOvers(e.target.value)}
                    placeholder="10"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>STRIKER</label>
                  <select className="input" value={quickStriker} onChange={(e) => setQuickStriker(e.target.value)} style={{ fontSize: '0.9rem' }}>
                    {quickBattingPlayers.map((player) => (
                      <option key={player} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>NON-STRIKER</label>
                  <select className="input" value={quickNonStriker} onChange={(e) => setQuickNonStriker(e.target.value)} style={{ fontSize: '0.9rem' }}>
                    {quickBattingPlayers.map((player) => (
                      <option key={player} value={player}>
                        {player}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>BOWLER</label>
                <select className="input" value={quickBowler} onChange={(e) => setQuickBowler(e.target.value)} style={{ fontSize: '0.9rem' }}>
                  {quickBowlingPlayers.map((player) => (
                    <option key={player} value={player}>
                      {player}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="button primary"
                onClick={() => {
                  if (onStartLiveMatch && quickTeamA && quickTeamB && quickTeamA !== quickTeamB && quickStriker !== quickNonStriker && Number(quickOvers)) {
                    onStartLiveMatch({
                      tournament: selectedTournament,
                      teamA: quickTeamA,
                      teamB: quickTeamB,
                      totalOvers: quickOvers,
                      striker: quickStriker,
                      nonStriker: quickNonStriker,
                      bowler: quickBowler
                    });
                  }
                }}
                disabled={!quickTeamA || !quickTeamB || quickTeamA === quickTeamB || quickStriker === quickNonStriker || !Number(quickOvers)}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  fontSize: '1rem', 
                  fontWeight: 700,
                  marginTop: '8px',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
                }}
              >
                🔴 START LIVE MATCH
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>📊 {quickOvers || 0} overs</span>
                <span>⚖️ Max {maxOversPerBowler} ov/bowler</span>
                <span>🏆 {selectedTournament ? 'Tournament' : 'Friendly'}</span>
              </div>
            </div>
          </div>

          {/* Create Tournament Card */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-md)', border: '2px solid #fbbf24' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid var(--border-light)' }}>
              <div style={{ fontSize: '2.5rem' }}>🏆</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Create Tournament</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start a new series</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>TOURNAMENT NAME</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter tournament name"
                  style={{ fontSize: '0.9rem' }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createTournament();
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>FORMAT</label>
                  <select className="input" value={format} onChange={(e) => setFormat(e.target.value)} style={{ fontSize: '0.9rem' }}>
                    <option value="league">League (Round Robin)</option>
                    <option value="knockout">Knockout</option>
                    <option value="league+knockout">League + Knockout</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>MATCH TYPE</label>
                  <select className="input" value={matchType} onChange={(e) => setMatchType(e.target.value)} style={{ fontSize: '0.9rem' }}>
                    <option value="limited-overs">Limited Overs</option>
                    <option value="t20">T20</option>
                    <option value="odi">ODI</option>
                    <option value="test">Test Match</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>OVERS PER MATCH</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="50"
                    value={oversPerMatch}
                    onChange={(e) => setOversPerMatch(e.target.value)}
                    placeholder="10"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>DURATION (DAYS)</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {(format === "league" || format === "league+knockout") && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>MIN POINTS TO AUTO-QUALIFY</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={minPointsToQualify}
                    onChange={(e) => setMinPointsToQualify(parseInt(e.target.value) || 0)}
                    placeholder="0 (Disable auto-qualification)"
                    style={{ fontSize: '0.9rem' }}
                  />
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Teams reaching this points threshold will be automatically marked as Qualified for the playoffs.
                  </p>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>SELECT TEAMS (MIN 2)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  {teams.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No teams available. Create teams first.</p>
                  ) : (
                    teams.map((team) => (
                      <label
                        key={team._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: selectedTeams.includes(team.name) ? '#003a6c' : 'white',
                          color: selectedTeams.includes(team.name) ? 'white' : '#0f172a',
                          border: `1px solid ${selectedTeams.includes(team.name) ? '#003a6c' : '#cbd5e1'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.name)}
                          onChange={() => toggleTeamSelection(team.name)}
                          style={{ accentColor: '#fbbf24' }}
                        />
                        {team.name}
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                className="button primary"
                onClick={createTournament}
                disabled={!name.trim() || selectedTeams.length < 2}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                  marginTop: '8px'
                }}
              >
                🏆 Create Tournament
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "list" && (
        <div>
          {tournaments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.5 }}>🏆</div>
              <h3 style={{ marginBottom: '12px', fontSize: '1.3rem' }}>No Tournaments Yet</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 24px' }}>
                Create your first tournament to start organizing matches and tracking standings.
              </p>
              <button
                className="button primary"
                onClick={() => setActiveTab("create")}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                }}
              >
                Create Your First Tournament
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {tournaments.map(t => (
                <div key={t._id} style={{ border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.5rem", background: "white", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '56px', 
                        height: '56px', 
                        borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)'
                      }}>
                        🏆
                      </div>
                      <div>
                        <h2 style={{ margin: "0 0 0.25rem 0", color: "#0f172a", fontSize: "1.5rem" }}>{t.name}</h2>
                        <div style={{ display: "flex", gap: "1rem", color: "#64748b", fontSize: "0.9rem", flexWrap: 'wrap' }}>
                          <span>Format: <strong style={{ color: "#0ea5e9" }}>{t.format?.toUpperCase() || 'LEAGUE'}</strong></span>
                          <span>Type: <strong>{t.matchType?.toUpperCase() || 'LIMITED OVERS'}</strong></span>
                          <span>Stage: <strong>{t.stage?.toUpperCase() || 'GROUP'}</strong></span>
                          <span>Duration: <strong>{t.durationDays || 1} Day(s)</strong></span>
                          {t.oversPerMatch && <span>Overs: <strong>{t.oversPerMatch}</strong></span>}
                        </div>
                      </div>
                    </div>
                    <button 
                      className="button danger compact-button" 
                      onClick={() => { 
                        if(window.confirm('Are you sure you want to delete this tournament?')) 
                          deleteTournament(t._id); 
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* POINTS TABLE */}
                  {(t.format === "league" || t.format === "league+knockout") && t.groups?.map((g, i) => (
                    <div key={i} className="points-table-container" style={{ marginBottom: "2rem" }}>
                      <h3 className="section-title" style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ display: "inline-block", width: "4px", height: "18px", background: "#ea580c", borderRadius: "2px" }}></span>
                        Points Table - {g.name}
                      </h3>
                      <div className="table-wrapper" style={{ overflowX: "auto", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                        <table className="pro-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", width: "60px" }}>Pos</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase" }}>Team</th>
                              <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", width: "60px" }}>P</th>
                              <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", width: "60px" }}>W</th>
                              <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", width: "60px" }}>L</th>
                              <th style={{ padding: "12px 16px", textAlign: "center", color: "#003a6c", fontWeight: "800", fontSize: "0.85rem", textTransform: "uppercase", width: "80px" }}>Pts</th>
                              {t.format !== "league" && (
                                <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", width: "80px" }}>Qualify</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {g.pointsTable?.sort((a, b) => b.points - a.points || b.won - a.won).map((pt, idx) => {
                              const isQualified = pt.qualified || (t.minPointsToQualify > 0 && pt.points >= t.minPointsToQualify);
                              return (
                                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 0.2s", backgroundColor: isQualified ? "rgba(22, 163, 74, 0.05)" : "transparent" }}>
                                  <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "bold", color: isQualified ? "#16a34a" : "#64748b" }}>
                                    {idx + 1}
                                  </td>
                                  <td style={{ padding: "14px 16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontWeight: "600", color: "#0f172a" }}>
                                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #003a6c, #0ea5e9)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold", boxShadow: "0 2px 4px rgba(0, 58, 108, 0.2)" }}>
                                        {pt.team.substring(0, 2).toUpperCase()}
                                      </div>
                                      {pt.team}
                                      {idx === 0 && <span style={{ marginLeft: "auto", fontSize: "0.7rem", background: "#ea580c", color: "white", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold", letterSpacing: "0.05em" }}>LEADER</span>}
                                      {isQualified && <span style={{ marginLeft: "auto", fontSize: "0.7rem", background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>Q</span>}
                                    </div>
                                  </td>
                                  <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569", fontWeight: "500" }}>{pt.played}</td>
                                  <td style={{ padding: "14px 16px", textAlign: "center", color: "#16a34a", fontWeight: "600" }}>{pt.won}</td>
                                  <td style={{ padding: "14px 16px", textAlign: "center", color: "#dc2626", fontWeight: "500" }}>{pt.lost}</td>
                                  <td style={{ padding: "14px 16px", textAlign: "center", color: "#003a6c", fontWeight: "800", fontSize: "1.1rem", background: "rgba(241, 245, 249, 0.5)" }}>{pt.points}</td>
                                  {t.format !== "league" && (
                                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                      <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                                        <input 
                                          type="checkbox" 
                                          checked={pt.qualified || false} 
                                          onChange={() => toggleQualifyStatus(t._id, pt.team, pt.qualified)}
                                          style={{ width: "18px", height: "18px", accentColor: "#16a34a", cursor: "pointer" }}
                                        />
                                      </label>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {t.format !== "league" && (
                        <div style={{ marginTop: "12px", display: "flex", gap: "16px", fontSize: "0.8rem", color: "#64748b" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(22, 163, 74, 0.1)", border: "1px solid rgba(22, 163, 74, 0.3)" }}></div>
                            <span>Manually tick the box to Qualify a team for the knockout stage.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* TOURNAMENT BRACKET VIEWER */}
                  {(t.format === "knockout" || t.format === "league+knockout") && t.matches?.length > 0 && (
                    <div style={{ marginBottom: "2.5rem" }}>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ display: "inline-block", width: "4px", height: "18px", background: "#f59e0b", borderRadius: "2px" }}></span>
                        Playoff Bracket Tree
                      </h3>
                      <TournamentBracket tournament={t} />
                    </div>
                  )}

                  {/* FIXTURES */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3 style={{ fontSize: "1.1rem", margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: "inline-block", width: "4px", height: "18px", background: "#0ea5e9", borderRadius: "2px" }}></span>
                        Fixtures & Results
                      </h3>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="button primary compact-button" onClick={() => setAddingMatchTo(t._id)}>
                          + Add Match
                        </button>
                        {t.matches?.length === 0 && (
                          <button className="button primary compact-button" onClick={() => generateMatches(t._id)}>
                            Auto-Generate
                          </button>
                        )}
                        {(t.format === "knockout" || t.format === "league+knockout") && t.matches?.length > 0 && (
                          <button className="button secondary compact-button" onClick={() => advanceKnockout(t._id)}>
                            Advance Stage
                          </button>
                        )}
                      </div>
                    </div>

                    {addingMatchTo === t._id && (
                      <div style={{ background: "#f1f5f9", padding: "1.25rem", borderRadius: "10px", marginBottom: "1.5rem", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 0.25rem 0", color: "#0f172a" }}>Add Manual Matches</h4>
                        <p style={{ margin: "0 0 1rem 0", color: "#64748b", fontSize: "0.8rem" }}>
                          Select teams and click **Add** to queue a match. The form will remain open so you can add multiple matches in sequence.
                        </p>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: 'wrap', alignItems: "center" }}>
                          <select className="input" style={{ flex: 1, minWidth: "160px" }} value={newMatchTeamA} onChange={(e) => setNewMatchTeamA(e.target.value)}>
                            <option value="">Select Team A</option>
                            {teams.map(team => <option key={team._id} value={team.name}>{team.name}</option>)}
                          </select>
                          <span style={{ fontWeight: "bold", color: "#64748b", fontSize: "0.9rem" }}>VS</span>
                          <select className="input" style={{ flex: 1, minWidth: "160px" }} value={newMatchTeamB} onChange={(e) => setNewMatchTeamB(e.target.value)}>
                            <option value="">Select Team B</option>
                            {teams.map(team => <option key={team._id} value={team.name}>{team.name}</option>)}
                          </select>
                          <button className="button primary" onClick={() => addManualMatch(t._id)} disabled={!newMatchTeamA || !newMatchTeamB || newMatchTeamA === newMatchTeamB}>
                            ➕ Add Match
                          </button>
                          <button className="button secondary" onClick={() => { setAddingMatchTo(null); setMatchAddedFeedback(""); }}>
                            Done / Close
                          </button>
                        </div>
                        {matchAddedFeedback && (
                          <div style={{ 
                            marginTop: "1rem", 
                            padding: "8px 14px", 
                            background: matchAddedFeedback.includes("Failed") ? "#fee2e2" : "#dcfce7", 
                            color: matchAddedFeedback.includes("Failed") ? "#991b1b" : "#166534", 
                            borderRadius: "6px", 
                            fontSize: "0.85rem", 
                            fontWeight: "bold",
                            border: matchAddedFeedback.includes("Failed") ? "1px solid #fca5a5" : "1px solid #bbf7d0",
                            width: "fit-content"
                          }}>
                            {matchAddedFeedback.includes("Failed") ? "❌" : "✅"} {matchAddedFeedback}
                          </div>
                        )}
                      </div>
                    )}

                    {t.matches?.length === 0 ? (
                      <p className="empty-state" style={{ padding: "1rem 0" }}>No matches generated. Click "Auto-Generate" to create fixtures.</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                        {t.matches.map((m, i) => (
                          <div key={m._id || i} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "1rem", background: m.status === "completed" ? "#f8fafc" : "white", transition: "all 0.2s" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "#64748b", fontSize: "0.8rem", fontWeight: "bold" }}>
                              <span>Match {i + 1}</span>
                              <span style={{ 
                                color: m.status === "completed" ? "#16a34a" : "#f59e0b",
                                background: m.status === "completed" ? "#dcfce7" : "#fef3c7",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "0.75rem"
                              }}>
                                {m.status?.toUpperCase() || 'PENDING'}
                              </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1.1rem", fontWeight: "bold" }}>
                              <span style={{ color: m.winner === m.teamA ? "#0369a1" : "inherit" }}>{m.teamA}</span>
                              <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>vs</span>
                              <span style={{ color: m.winner === m.teamB ? "#0369a1" : "inherit" }}>{m.teamB}</span>
                            </div>

                            {m.status !== "completed" && (
                              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                {m.teamB !== "BYE" && m.matchRef && (
                                  <button className="button primary compact-button" style={{ flex: "1 1 100%" }} onClick={() => onResumeMatch && onResumeMatch(m.matchRef)}>
                                    Resume Live Match
                                  </button>
                                )}
                                {m.teamB !== "BYE" && !m.matchRef && startingMatchId !== m._id && (
                                  <button className="button primary compact-button" style={{ flex: "1 1 100%" }} onClick={() => {
                                    setStartingMatchId(m._id);
                                    const teamABatters = getPlayers(m.teamA);
                                    const teamBBowlers = getPlayers(m.teamB);
                                    setStartStriker(teamABatters[0]);
                                    setStartNonStriker(teamABatters[1] || teamABatters[0]);
                                    setStartBowler(teamBBowlers[0]);
                                  }}>
                                    Start Live Match
                                  </button>
                                )}
                                {m.teamB !== "BYE" && (
                                  <>
                                    <button className="button secondary compact-button" style={{ flex: 1 }} onClick={() => simulateMatchResult(t._id, m._id, m.teamA, m.teamA, m.teamB)}>
                                      {m.teamA} Won
                                    </button>
                                    <button className="button secondary compact-button" style={{ flex: 1 }} onClick={() => simulateMatchResult(t._id, m._id, m.teamB, m.teamA, m.teamB)}>
                                      {m.teamB} Won
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            {startingMatchId === m._id && (
                              <div style={{ marginTop: "1rem", padding: "1rem", background: "#f1f5f9", borderRadius: "8px" }}>
                                <h4 style={{ margin: "0 0 0.5rem 0" }}>Match Setup</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                  <input type="number" className="input" value={startOvers} onChange={e => setStartOvers(e.target.value)} placeholder="Overs" min="1" />
                                  <select className="input" value={startStriker} onChange={e => setStartStriker(e.target.value)}>
                                    {getPlayers(m.teamA).map(p => <option key={p} value={p}>{p} (Striker)</option>)}
                                  </select>
                                  <select className="input" value={startNonStriker} onChange={e => setStartNonStriker(e.target.value)}>
                                    {getPlayers(m.teamA).map(p => <option key={p} value={p}>{p} (Non-Striker)</option>)}
                                  </select>
                                  <select className="input" value={startBowler} onChange={e => setStartBowler(e.target.value)}>
                                    {getPlayers(m.teamB).map(p => <option key={p} value={p}>{p} (Bowler)</option>)}
                                  </select>
                                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                    <button className="button primary compact-button" style={{ flex: 1 }} onClick={() => {
                                      if (onStartLiveMatch) {
                                        onStartLiveMatch({
                                          tournament: t._id,
                                          teamA: m.teamA,
                                          teamB: m.teamB,
                                          totalOvers: startOvers,
                                          striker: startStriker,
                                          nonStriker: startNonStriker,
                                          bowler: startBowler
                                        });
                                      }
                                      setStartingMatchId(null);
                                    }}>Start</button>
                                    <button className="button secondary compact-button" style={{ flex: 1 }} onClick={() => setStartingMatchId(null)}>Cancel</button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {m.status === "completed" && (
                              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#166534", fontWeight: "600" }}>
                                Winner: <strong>{m.winner}</strong>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Tournament;