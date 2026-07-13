import { useState, useEffect } from "react";
import API from "../api";

function TeamManager({ teams, setTeams, allPlayers, setAllPlayers, onBack }) {
  const [teamName, setTeamName] = useState("");
  const [playerNames, setPlayerNames] = useState({});
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [bulkActionTeam, setBulkActionTeam] = useState("");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [dashboardView, setDashboardView] = useState("teams"); // 'teams' or 'dashboard'

  useEffect(() => {
    fetchAllPlayers();
  }, []);

  useEffect(() => {
    // Apply dark mode to body
    if (darkMode) {
      document.body.style.background = '#0f172a';
      document.body.style.color = '#e2e8f0';
    } else {
      document.body.style.background = '#ffffff';
      document.body.style.color = '#0f172a';
    }
  }, [darkMode]);

  async function fetchAllPlayers() {
    try {
      const res = await API.get("/players");
      setAllPlayers(res.data || []);
    } catch (err) {
      console.warn("API not available, skipping players fetch", err);
    }
  }

  async function createTeam() {
    if (!teamName.trim()) return;

    try {
      await API.post("/teams", {
        name: teamName,
        players: []
      });
      fetchTeams();
    } catch (err) {
      console.warn("API not available, saving locally", err);
      setTeams((prev) => [...prev, { _id: Date.now().toString(), name: teamName, players: [] }]);
    }

    setTeamName("");
  }

  async function fetchTeams() {
    try {
      const res = await API.get("/teams");
      setTeams(res.data || []);
    } catch (err) {
      console.warn("API not available, keeping local state", err);
    }
  }

  async function deleteTeam(teamId) {
    try {
      await API.delete(`/teams/${teamId}`);
      fetchTeams();
    } catch (error) {
      console.warn("API not available, deleting locally", error);
      setTeams((prev) => prev.filter(t => t._id !== teamId));
    }
  }

  async function addPlayerToTeam(team) {
    const playerName = playerNames[team._id]?.trim();

    if (!playerName) return;

    const existingPlayer = allPlayers.find(p => p.name.toLowerCase() === playerName.toLowerCase());

    if (existingPlayer) {
      if (team.players && team.players.includes(existingPlayer.name)) {
        alert(`${existingPlayer.name} is already in the team.`);
        return;
      }
      try {
        // Find if they belong to a different team
        const otherTeam = teams.find(t => t.players && t.players.includes(existingPlayer.name));
        if (otherTeam && otherTeam._id !== team._id) {
          // Remove them from the other team first
          const updatedOtherPlayers = otherTeam.players.filter(p => p !== existingPlayer.name);
          await API.put(`/teams/${otherTeam._id}`, { players: updatedOtherPlayers });
        }

        const newPlayers = [...(team.players || []), existingPlayer.name];
        await API.put(`/teams/${team._id}`, { players: newPlayers });
        await API.put(`/players/${existingPlayer._id}`, { team: team.name });
        fetchTeams();
        fetchAllPlayers();
      } catch (err) {
        console.warn("API not available, adding existing player locally", err);
        setTeams((prev) => prev.map(t => {
          if (t._id === team._id) {
            return { ...t, players: [...(t.players || []), existingPlayer.name] };
          }
          // Remove from other teams locally
          if (t.players && t.players.includes(existingPlayer.name)) {
            return { ...t, players: t.players.filter(p => p !== existingPlayer.name) };
          }
          return t;
        }));
      }
    } else {
      try {
        await API.post("/players", {
          name: playerName,
          teamId: team._id
        });
        fetchTeams();
        fetchAllPlayers();
      } catch (err) {
        console.warn("API not available, adding player locally", err);
        setTeams((prev) => prev.map(t => {
          if (t._id === team._id) {
            return { ...t, players: [...(t.players || []), playerName] };
          }
          return t;
        }));
      }
    }

    setPlayerNames((current) => ({
      ...current,
      [team._id]: ""
    }));
  }

  async function updatePlayerRole(playerId, updates) {
    try {
      await API.put(`/players/${playerId}`, updates);
      fetchAllPlayers();
    } catch (err) {
      console.warn("Could not update player role", err);
    }
  }

  async function updateTeamLeaders(teamId, updates) {
    try {
      await API.put(`/teams/${teamId}`, updates);
      fetchTeams();
    } catch (err) {
      console.warn("Could not update team leaders locally", err);
      setTeams((prev) => prev.map(t => t._id === teamId ? { ...t, ...updates } : t));
    }
  }

  async function movePlayer(team, index, direction) {
    const newPlayers = [...team.players];
    if (direction === -1 && index > 0) {
      [newPlayers[index - 1], newPlayers[index]] = [newPlayers[index], newPlayers[index - 1]];
    } else if (direction === 1 && index < newPlayers.length - 1) {
      [newPlayers[index + 1], newPlayers[index]] = [newPlayers[index], newPlayers[index + 1]];
    } else {
      return;
    }

    try {
      await API.put(`/teams/${team._id}`, { players: newPlayers });
      fetchTeams();
    } catch (err) {
      console.warn("Could not update team order locally", err);
      setTeams((prev) => prev.map(t => t._id === team._id ? { ...t, players: newPlayers } : t));
    }
  }

  // Bulk actions
  const togglePlayerSelection = (playerName) => {
    setSelectedPlayers(prev => 
      prev.includes(playerName) 
        ? prev.filter(p => p !== playerName)
        : [...prev, playerName]
    );
  };

  const selectAllPlayers = () => {
    const allPlayerNames = teams.flatMap(t => t.players || []);
    setSelectedPlayers(allPlayerNames);
  };

  const clearSelection = () => {
    setSelectedPlayers([]);
  };

  const bulkAddToTeam = async () => {
    if (!bulkActionTeam || selectedPlayers.length === 0) return;

    const targetTeam = teams.find(t => t._id === bulkActionTeam);
    if (!targetTeam) return;

    try {
      const updatedPlayers = [...new Set([...(targetTeam.players || []), ...selectedPlayers])];
      await API.put(`/teams/${bulkActionTeam}`, { players: updatedPlayers });
      fetchTeams();
      setSelectedPlayers([]);
      setBulkActionTeam("");
      setShowBulkActions(false);
      alert(`✅ Added ${selectedPlayers.length} player(s) to ${targetTeam.name}`);
    } catch (err) {
      console.warn("Bulk add failed", err);
      alert("❌ Failed to add players. Please try again.");
    }
  };

  // Filter players based on search and role
  const getFilteredPlayers = () => {
    return allPlayers.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === "all" || player.role === filterRole;
      return matchesSearch && matchesRole;
    });
  };

  const totalPlayers = teams.reduce((sum, t) => sum + (t.players?.length || 0), 0);
  const teamsWithPlayers = teams.filter(t => t.players?.length > 0).length;
  const avgTeamSize = teams.length > 0 ? (totalPlayers / teams.length).toFixed(1) : 0;

  // Dashboard stats
  const getRoleDistribution = () => {
    const roles = {};
    allPlayers.forEach(player => {
      const role = player.role || 'Unassigned';
      roles[role] = (roles[role] || 0) + 1;
    });
    return Object.entries(roles).sort((a, b) => b[1] - a[1]);
  };

  const getTeamStats = () => {
    return teams.map(team => {
      const teamPlayers = team.players || [];
      const playersWithDetails = teamPlayers.map(name => 
        allPlayers.find(p => p.name === name)
      ).filter(Boolean);
      
      const totalRuns = playersWithDetails.reduce((sum, p) => sum + (p.batting?.runs || 0), 0);
      const totalWickets = playersWithDetails.reduce((sum, p) => sum + (p.bowling?.wickets || 0), 0);
      
      return {
        name: team.name,
        playerCount: teamPlayers.length,
        totalRuns,
        totalWickets,
        avgRuns: teamPlayers.length > 0 ? (totalRuns / teamPlayers.length).toFixed(1) : 0
      };
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Captain': return '#dc2626';
      case 'Vice-Captain': return '#f59e0b';
      case 'Batter': return '#3b82f6';
      case 'Bowler': return '#10b981';
      case 'All-rounder': return '#8b5cf6';
      case 'Wicket-keeper': return '#ec4899';
      default: return '#64748b';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const bgColor = darkMode ? '#0f172a' : '#ffffff';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const textColor = darkMode ? '#e2e8f0' : '#0f172a';
  const secondaryText = darkMode ? '#94a3b8' : '#64748b';
  const borderColor = darkMode ? '#334155' : '#e2e8f0';

  return (
    <section className="panel" style={{ 
      padding: 0, 
      overflow: 'hidden',
      background: bgColor,
      minHeight: '100vh',
      transition: 'background 0.3s, color 0.3s'
    }}>
      {/* Enhanced Header */}
      <div style={{
        background: darkMode 
          ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
          : 'linear-gradient(135deg, #003a6c 0%, #0ea5e9 100%)',
        padding: '2rem 2rem 1.5rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'translate(30%, -30%)'
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', fontWeight: '700' }}>🏟️ Team Manager</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>Build and manage your cricket squads</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s'
                }}
              >
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s'
                  }}
                >
                  ← Back
                </button>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              onClick={() => setDashboardView('teams')}
              style={{
                padding: '0.625rem 1.25rem',
                background: dashboardView === 'teams' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s'
              }}
            >
              📋 Teams View
            </button>
            <button
              onClick={() => setDashboardView('dashboard')}
              style={{
                padding: '0.625rem 1.25rem',
                background: dashboardView === 'dashboard' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s'
              }}
            >
              📊 Dashboard
            </button>
          </div>

          {/* Stats Pills */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '1.5rem' }}>🏏</div>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Total Teams</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{teams.length}</div>
              </div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '1.5rem' }}>✅</div>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Active Teams</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{teamsWithPlayers}</div>
              </div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '1.5rem' }}>👥</div>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Total Players</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{totalPlayers}</div>
              </div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '1.5rem' }}>📊</div>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Avg Team Size</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{avgTeamSize}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ 
        padding: '1rem 2rem', 
        background: cardBg, 
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        transition: 'background 0.3s, border 0.3s'
      }}>
        <input
          type="text"
          placeholder="🔍 Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.75rem 1rem',
            fontSize: '0.95rem',
            border: `2px solid ${borderColor}`,
            borderRadius: '10px',
            background: darkMode ? '#0f172a' : '#f8fafc',
            color: textColor,
            transition: 'all 0.2s'
          }}
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '0.95rem',
            border: `2px solid ${borderColor}`,
            borderRadius: '10px',
            background: darkMode ? '#0f172a' : '#f8fafc',
            color: textColor,
            cursor: 'pointer',
            fontWeight: '500',
            minWidth: '150px',
            transition: 'all 0.2s'
          }}
        >
          <option value="all">All Roles</option>
          <option value="Batter">Batter</option>
          <option value="Bowler">Bowler</option>
          <option value="All-rounder">All-rounder</option>
          <option value="Wicket-keeper">Wicket-keeper</option>
        </select>
        {selectedPlayers.length > 0 && (
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            ⚡ Bulk Actions ({selectedPlayers.length})
          </button>
        )}
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <div style={{
          padding: '1.5rem 2rem',
          background: darkMode ? '#1e293b' : '#fef3c7',
          borderBottom: `2px solid #f59e0b`,
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          transition: 'background 0.3s'
        }}>
          <span style={{ fontWeight: '600', color: darkMode ? '#fbbf24' : '#92400e' }}>
            📦 {selectedPlayers.length} player(s) selected
          </span>
          <select
            value={bulkActionTeam}
            onChange={(e) => setBulkActionTeam(e.target.value)}
            style={{
              padding: '0.625rem 1rem',
              fontSize: '0.9rem',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              background: 'white',
              color: '#0f172a',
              cursor: 'pointer',
              fontWeight: '500',
              minWidth: '200px'
            }}
          >
            <option value="">Select team to add to...</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>{team.name}</option>
            ))}
          </select>
          <button
            onClick={bulkAddToTeam}
            disabled={!bulkActionTeam}
            style={{
              padding: '0.625rem 1.25rem',
              background: bulkActionTeam ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : '#cbd5e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: bulkActionTeam ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            ➕ Add to Team
          </button>
          <button
            onClick={clearSelection}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'white',
              color: '#64748b',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            ✕ Clear Selection
          </button>
        </div>
      )}

      {/* Dashboard View */}
      {dashboardView === 'dashboard' && (
        <div style={{ padding: '2rem', background: darkMode ? '#0f172a' : '#f8fafc', transition: 'background 0.3s' }}>
          {/* Role Distribution */}
          <div style={{
            background: cardBg,
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: `1px solid ${borderColor}`,
            marginBottom: '2rem',
            transition: 'all 0.3s'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: textColor,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#003a6c', borderRadius: '2px' }}></span>
              Role Distribution
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {getRoleDistribution().map(([role, count]) => (
                <div key={role} style={{
                  padding: '1.25rem',
                  background: darkMode ? '#0f172a' : 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  borderRadius: '12px',
                  border: `2px solid ${getRoleColor(role)}40`,
                  textAlign: 'center',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👤</div>
                  <div style={{ fontSize: '0.8rem', color: secondaryText, fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    {role}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: getRoleColor(role) }}>{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Statistics */}
          <div style={{
            background: cardBg,
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: `1px solid ${borderColor}`,
            transition: 'all 0.3s'
          }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: textColor,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#10b981', borderRadius: '2px' }}></span>
              Team Statistics
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {getTeamStats().map((stat, idx) => (
                <div key={idx} style={{
                  padding: '1.5rem',
                  background: darkMode ? '#0f172a' : 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  borderRadius: '12px',
                  border: `1px solid ${borderColor}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: '700', color: textColor, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      {stat.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: secondaryText }}>
                      {stat.playerCount} player{stat.playerCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: secondaryText, fontWeight: '600', marginBottom: '0.25rem' }}>TOTAL RUNS</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b' }}>{stat.totalRuns}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: secondaryText, fontWeight: '600', marginBottom: '0.25rem' }}>TOTAL WICKETS</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>{stat.totalWickets}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: secondaryText, fontWeight: '600', marginBottom: '0.25rem' }}>AVG RUNS</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#003a6c' }}>{stat.avgRuns}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Teams View */}
      {dashboardView === 'teams' && (
        <div style={{ padding: '2rem', background: darkMode ? '#0f172a' : '#f8fafc', transition: 'background 0.3s' }}>
          {/* Create Team Section */}
          <div style={{ 
            padding: '1.5rem 2rem', 
            background: cardBg, 
            borderBottom: `1px solid ${borderColor}`,
            marginBottom: '2rem',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.3s'
          }}>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '700',
              color: textColor,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>➕</span>
              Create New Team
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '600px' }}>
              <input
                className="input"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") createTeam();
                }}
                style={{
                  flex: 1,
                  padding: '0.875rem 1rem',
                  fontSize: '0.95rem',
                  border: `2px solid ${borderColor}`,
                  borderRadius: '10px',
                  background: darkMode ? '#0f172a' : '#f8fafc',
                  color: textColor,
                  transition: 'all 0.2s'
                }}
              />
              <button
                className="button primary"
                onClick={createTeam}
                disabled={!teamName.trim()}
                style={{
                  minWidth: '140px',
                  padding: '0.875rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #003a6c, #0ea5e9)',
                  boxShadow: '0 4px 12px rgba(0, 58, 108, 0.3)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                + Create Team
              </button>
            </div>
          </div>

          {/* Teams Grid */}
          {teams.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: cardBg,
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${borderColor}`,
              transition: 'all 0.3s'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🏏</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: textColor }}>No teams yet</h3>
              <p style={{ margin: 0, color: secondaryText, fontSize: '0.95rem' }}>Create your first team to get started</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {teams.map((team) => {
                const teamPlayers = team.players || [];
                const hasPlayers = teamPlayers.length > 0;
                const isExpanded = expandedTeam === team._id;

                return (
                  <div
                    key={team._id}
                    style={{
                      background: cardBg,
                      borderRadius: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      border: `1px solid ${borderColor}`,
                      overflow: 'hidden',
                      transition: 'all 0.3s'
                    }}
                  >
                    {/* Team Header */}
                    <div style={{
                      padding: '1.5rem',
                      background: darkMode ? '#1e293b' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderBottom: `1px solid ${borderColor}`,
                      transition: 'all 0.3s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
                          <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #003a6c, #0ea5e9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            boxShadow: '0 4px 12px rgba(0, 58, 108, 0.3)',
                            flexShrink: 0
                          }}>
                            🏏
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{
                              margin: '0 0 0.25rem 0',
                              fontSize: '1.25rem',
                              fontWeight: '700',
                              color: textColor
                            }}>
                              {team.name}
                            </h3>
                            <p style={{
                              margin: 0,
                              fontSize: '0.85rem',
                              color: secondaryText
                            }}>
                              {teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''} • {hasPlayers ? 'Active' : 'Add players'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${team.name}"? This cannot be undone.`)) {
                              deleteTeam(team._id);
                            }
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#dc2626',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    {/* Players List */}
                    {hasPlayers && (
                      <div style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {teamPlayers.map((player, idx) => {
                            const pObj = allPlayers.find(p => p.name === player && p.team === team.name) || { _id: null, name: player, role: '', bowlerType: '' };
                            const roleColor = getRoleColor(pObj.role);
                            const isSelected = selectedPlayers.includes(player);

                            return (
                              <div
                                key={player}
                                style={{
                                  padding: '1rem',
                                  background: darkMode ? '#0f172a' : '#f8fafc',
                                  borderRadius: '12px',
                                  border: `2px solid ${isSelected ? '#003a6c' : borderColor}`,
                                  transition: 'all 0.2s',
                                  cursor: 'pointer'
                                }}
                                onClick={() => togglePlayerSelection(player)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: pObj._id ? '0.75rem' : 0 }}>
                                  <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: isSelected ? '#003a6c' : 'linear-gradient(135deg, #003a6c, #0ea5e9)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    fontSize: '0.85rem',
                                    flexShrink: 0,
                                    transition: 'all 0.2s'
                                  }}>
                                    {isSelected ? '✓' : getInitials(player)}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: '600', color: textColor, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                      {idx + 1}. {player}
                                    </div>
                                    {pObj._id && pObj.role ? (
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.625rem',
                                        background: `${roleColor}20`,
                                        color: roleColor,
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        border: `1px solid ${roleColor}40`
                                      }}>
                                        {pObj.role}{pObj.bowlerType ? ` (${pObj.bowlerType})` : ''}
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.75rem', color: secondaryText }}>No role set</span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.375rem' }} onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => movePlayer(team, idx, -1)}
                                      disabled={idx === 0}
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        border: `1px solid ${borderColor}`,
                                        background: cardBg,
                                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                        opacity: idx === 0 ? 0.4 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        color: secondaryText,
                                        transition: 'all 0.2s'
                                      }}
                                      title="Move up"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={() => movePlayer(team, idx, 1)}
                                      disabled={idx === teamPlayers.length - 1}
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        border: `1px solid ${borderColor}`,
                                        background: cardBg,
                                        cursor: idx === teamPlayers.length - 1 ? 'not-allowed' : 'pointer',
                                        opacity: idx === teamPlayers.length - 1 ? 0.4 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        color: secondaryText,
                                        transition: 'all 0.2s'
                                      }}
                                      title="Move down"
                                    >
                                      ▼
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (window.confirm(`Remove ${player} from ${team.name}?`)) {
                                          const newPlayers = teamPlayers.filter(p => p !== player);
                                          try {
                                            await API.put(`/teams/${team._id}`, { players: newPlayers });
                                            fetchTeams();
                                          } catch (err) {
                                            setTeams((prev) => prev.map(t => t._id === team._id ? { ...t, players: newPlayers } : t));
                                          }
                                        }
                                      }}
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        background: 'rgba(239, 68, 68, 0.05)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        color: '#dc2626',
                                        transition: 'all 0.2s'
                                      }}
                                      title="Remove player"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>

                                {pObj._id && (
                                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                    <select
                                      value={pObj.role || ''}
                                      onChange={e => updatePlayerRole(pObj._id, { role: e.target.value })}
                                      style={{
                                        flex: 1,
                                        padding: '0.5rem 0.75rem',
                                        fontSize: '0.8rem',
                                        borderRadius: '8px',
                                        border: `1px solid ${borderColor}`,
                                        background: cardBg,
                                        color: textColor,
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        transition: 'all 0.2s'
                                      }}
                                    >
                                      <option value="">Set role...</option>
                                      <option value="Batter">Batter</option>
                                      <option value="Bowler">Bowler</option>
                                      <option value="All-rounder">All-rounder</option>
                                      <option value="Wicket-keeper">Wk-Batter</option>
                                    </select>
                                    {(pObj.role === 'Bowler' || pObj.role === 'All-rounder') && (
                                      <select
                                        value={pObj.bowlerType || ''}
                                        onChange={e => updatePlayerRole(pObj._id, { bowlerType: e.target.value })}
                                        style={{
                                          flex: 1,
                                          padding: '0.5rem 0.75rem',
                                          fontSize: '0.8rem',
                                          borderRadius: '8px',
                                          border: `1px solid ${borderColor}`,
                                          background: cardBg,
                                          color: textColor,
                                          cursor: 'pointer',
                                          fontWeight: '500',
                                          transition: 'all 0.2s'
                                        }}
                                      >
                                        <option value="">Bowling type...</option>
                                        <option value="Fast">Fast</option>
                                        <option value="Spin">Spin</option>
                                      </select>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Captain & VC Selectors */}
                        {teamPlayers.length >= 2 && (
                          <div style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: `1px solid ${borderColor}`,
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.75rem'
                          }}>
                            <div>
                              <label style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: secondaryText,
                                marginBottom: '0.375rem',
                                display: 'block'
                              }}>
                                👑 Captain
                              </label>
                              <select
                                className="leader-select"
                                value={team.captain || ""}
                                onChange={e => updateTeamLeaders(team._id, { captain: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.85rem',
                                  borderRadius: '8px',
                                  border: `1px solid ${borderColor}`,
                                  background: cardBg,
                                  color: textColor,
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <option value="">Select captain...</option>
                                {teamPlayers.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: secondaryText,
                                marginBottom: '0.375rem',
                                display: 'block'
                              }}>
                                ⭐ Vice Captain
                              </label>
                              <select
                                className="leader-select"
                                value={team.viceCaptain || ""}
                                onChange={e => updateTeamLeaders(team._id, { viceCaptain: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.85rem',
                                  borderRadius: '8px',
                                  border: `1px solid ${borderColor}`,
                                  background: cardBg,
                                  color: textColor,
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <option value="">Select VC...</option>
                                {teamPlayers.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Add Player Form */}
                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: `1px solid ${borderColor}`
                        }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              list={`player-search-${team._id}`}
                              className="add-player-input"
                              value={playerNames[team._id] || ""}
                              onChange={(e) =>
                                setPlayerNames((current) => ({
                                  ...current,
                                  [team._id]: e.target.value
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") addPlayerToTeam(team);
                              }}
                              placeholder="Search or add new player..."
                              style={{
                                flex: 1,
                                padding: '0.625rem 0.875rem',
                                fontSize: '0.875rem',
                                border: `1px solid ${borderColor}`,
                                borderRadius: '8px',
                                background: cardBg,
                                color: textColor,
                                transition: 'all 0.2s'
                              }}
                            />
                            <datalist id={`player-search-${team._id}`}>
                              {allPlayers
                                .filter(p => !teamPlayers.includes(p.name))
                                .map(p => (
                                  <option key={p._id} value={p.name}>
                                    {p.team && p.team !== team.name ? `(from ${p.team})` : ""}
                                  </option>
                                ))}
                            </datalist>
                            <button
                              className="add-player-btn"
                              onClick={() => addPlayerToTeam(team)}
                              style={{
                                padding: '0.625rem 1rem',
                                background: 'linear-gradient(135deg, #003a6c, #0ea5e9)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                boxShadow: '0 2px 8px rgba(0, 58, 108, 0.2)',
                                transition: 'all 0.2s'
                              }}
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Empty State - Add First Player */}
                    {!hasPlayers && (
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            list={`player-search-${team._id}`}
                            className="add-player-input"
                            value={playerNames[team._id] || ""}
                            onChange={(e) =>
                              setPlayerNames((current) => ({
                                ...current,
                                [team._id]: e.target.value
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addPlayerToTeam(team);
                            }}
                            placeholder="Add first player..."
                            style={{
                              flex: 1,
                              padding: '0.75rem 1rem',
                              fontSize: '0.9rem',
                              border: `2px dashed ${borderColor}`,
                              borderRadius: '10px',
                              background: cardBg,
                              color: textColor,
                              transition: 'all 0.2s'
                            }}
                          />
                          <datalist id={`player-search-${team._id}`}>
                            {allPlayers.map(p => (
                              <option key={p._id} value={p.name}>
                                {p.team && p.team !== team.name ? `(from ${p.team})` : ""}
                              </option>
                            ))}
                          </datalist>
                          <button
                            className="add-player-btn"
                            onClick={() => addPlayerToTeam(team)}
                            style={{
                              padding: '0.75rem 1.25rem',
                              background: 'linear-gradient(135deg, #003a6c, #0ea5e9)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              boxShadow: '0 2px 8px rgba(0, 58, 108, 0.2)',
                              transition: 'all 0.2s'
                            }}
                          >
                            + Add Player
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* All Players Section with Filters */}
          {allPlayers.length > 0 && (
            <div style={{
              background: cardBg,
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${borderColor}`,
              marginTop: '2rem',
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700',
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#8b5cf6', borderRadius: '2px' }}></span>
                  All Players ({getFilteredPlayers().length})
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={selectAllPlayers}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3b82f6',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    ☑️ Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(100, 116, 139, 0.1)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      color: secondaryText,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✕ Clear
                  </button>
                </div>
              </div>
              
              {getFilteredPlayers().length === 0 ? (
                <p style={{ textAlign: 'center', color: secondaryText, padding: '2rem' }}>
                  No players found matching your criteria
                </p>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: '1rem' 
                }}>
                  {getFilteredPlayers().map(player => {
                    const isSelected = selectedPlayers.includes(player.name);
                    const roleColor = getRoleColor(player.role);

                    return (
                      <div
                        key={player._id}
                        onClick={() => togglePlayerSelection(player.name)}
                        style={{
                          padding: '1.25rem',
                          background: darkMode ? '#0f172a' : '#f8fafc',
                          borderRadius: '12px',
                          border: `2px solid ${isSelected ? '#003a6c' : borderColor}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                      >
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#003a6c',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}>
                            ✓
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            background: isSelected ? '#003a6c' : 'linear-gradient(135deg, #003a6c, #0ea5e9)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            flexShrink: 0,
                            transition: 'all 0.2s'
                          }}>
                            {getInitials(player.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '600', color: textColor, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                              {player.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: secondaryText, marginBottom: '0.375rem' }}>
                              {player.team || 'No team'}
                            </div>
                            {player.role && (
                              <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.625rem',
                                background: `${roleColor}20`,
                                color: roleColor,
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                border: `1px solid ${roleColor}40`
                              }}>
                                {player.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .panel {
            padding: 0 !important;
          }
          
          .panel > div:first-child {
            padding: 1.5rem 1rem !important;
          }
          
          .panel > div:first-child h2 {
            font-size: 1.5rem !important;
          }
          
          .panel > div:first-child > div:last-child > div {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .panel input[type="text"] {
            font-size: 0.875rem !important;
          }
          
          .panel button {
            padding: 0.75rem 1rem !important;
            font-size: 0.875rem !important;
          }
          
          .panel > div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
          
          .panel > div[style*="padding: 2rem"] {
            padding: 1rem !important;
          }
          
          .panel > div[style*="gridTemplateColumns: repeat(auto-fill"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

export default TeamManager;