import React, { useState, useEffect } from "react";
import API from "../api";
import WagonWheel from "../WagonWheel";
import PlayerCard from "../components/PlayerCard";
import "./PlayerAnalyticsDashboard.css";
import "./PlayerProfile.css";

function UserProfile({ userName, userEmail, userRole = "Player", teamsCount, tournamentsCount, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedPlayerName, setSelectedPlayerName] = useState(userName || '');
  const [allPlayersFromTeams, setAllPlayersFromTeams] = useState([]);

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'App User');

  // Fetch teams and extract players
  useEffect(() => {
    async function fetchTeams() {
      try {
        const teamsRes = await API.get('/teams');
        const teams = teamsRes.data || [];
        setAvailableTeams(teams);
        
        // Extract all unique players from teams
        const playersSet = new Set();
        teams.forEach(team => {
          if (team.players && Array.isArray(team.players)) {
            team.players.forEach(playerName => {
              if (playerName && playerName.trim()) {
                playersSet.add(playerName.trim());
              }
            });
          }
        });
        const allPlayers = Array.from(playersSet).sort();
        setAllPlayersFromTeams(allPlayers);
        console.log('All players from teams:', allPlayers);
      } catch (err) {
        console.warn('Could not fetch teams', err);
        setAvailableTeams([]);
        setAllPlayersFromTeams([]);
      }
    }

    fetchTeams();
  }, []);

  // Auto-select first player if none selected (only runs when teams load)
  const hasAutoSelected = React.useRef(false);
  useEffect(() => {
    if (!hasAutoSelected.current && allPlayersFromTeams.length > 0 && !selectedPlayerName) {
      hasAutoSelected.current = true;
      setSelectedPlayerName(allPlayersFromTeams[0]);
      console.log('Auto-selected first player:', allPlayersFromTeams[0]);
    }
  }, [allPlayersFromTeams]);

  useEffect(() => {
    async function fetchPlayerData() {
      console.log('Fetch player data called with:', { userRole, selectedPlayerName });
      
      if (userRole !== 'Player') {
        console.log('Not a player role, skipping');
        setLoading(false);
        return;
      }

      if (!selectedPlayerName) {
        console.log('No player name selected');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch all players from database
        const playersRes = await API.get('/players');
        const allPlayers = playersRes.data || [];
        
        console.log('All players in DB:', allPlayers);
        console.log('Looking for player:', selectedPlayerName);

        // Try to find player by exact name match
        let player = allPlayers.find(p => p.name === selectedPlayerName);
        
        // If not found, try case-insensitive match
        if (!player) {
          player = allPlayers.find(p => p.name.toLowerCase() === selectedPlayerName.toLowerCase());
        }
        
        // If still not found, try partial match
        if (!player) {
          player = allPlayers.find(p => p.name.toLowerCase().includes(selectedPlayerName.toLowerCase()) || selectedPlayerName.toLowerCase().includes(p.name.toLowerCase()));
        }

        // If still not found and we have players in DB, use the first one
        if (!player && allPlayers.length > 0) {
          console.log('Player not found, using first available player from DB');
          player = allPlayers[0];
        }

        if (!player) {
          console.log('No players found in database');
          setAnalyticsData(null);
          setLoading(false);
          return;
        }

        console.log('Found player:', player);

        const matchesRes = await API.get("/matches");
        const allMatches = matchesRes.data || [];

        const matchPerformances = [];
        const aggregatedWagonWheel = { ...(player.batting?.wagonWheel || {}) };
        const monthlyStats = {};

        allMatches.forEach(match => {
          if (!match.matchResult) return;

          let batted = false, bowled = false;
          let runsScored = 0, ballsFaced = 0, fours = 0, sixes = 0;
          let ballsBowled = 0, runsConceded = 0, wicketsTaken = 0;

          const checkInnings = (innings) => {
            if (!innings) return;
            if (innings.battingStats && innings.battingStats[player.name]) {
              batted = true;
              const stats = innings.battingStats[player.name];
              runsScored += stats.runs || 0;
              ballsFaced += stats.balls || 0;
              fours += stats.fours || 0;
              sixes += stats.sixes || 0;

              if (stats.wagonWheel) {
                Object.keys(stats.wagonWheel).forEach(region => {
                  aggregatedWagonWheel[region] = (aggregatedWagonWheel[region] || 0) + stats.wagonWheel[region];
                });
              }
            }
            if (innings.bowlingStats && innings.bowlingStats[player.name]) {
              bowled = true;
              const stats = innings.bowlingStats[player.name];
              ballsBowled += stats.balls || 0;
              runsConceded += stats.runs || 0;
              wicketsTaken += stats.wickets || 0;
            }
          };

          if (match.firstInnings) checkInnings(match.firstInnings);
          if (match.innings === 2) checkInnings(match);
          if (match.innings === 1 && !match.firstInnings) checkInnings(match);

          if (batted || bowled) {
            const matchDate = new Date(match.createdAt || Date.now());
            const monthKey = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyStats[monthKey]) {
              monthlyStats[monthKey] = { runs: 0, wickets: 0, matches: 0 };
            }
            monthlyStats[monthKey].runs += runsScored;
            monthlyStats[monthKey].wickets += wicketsTaken;
            monthlyStats[monthKey].matches += 1;

            matchPerformances.push({
              matchId: match._id,
              date: matchDate,
              vsTeam: match.teamA === player.team ? match.teamB : match.teamA,
              tournament: match.tournament || 'Friendly',
              runsScored,
              ballsFaced,
              fours,
              sixes,
              wicketsTaken,
              runsConceded,
              oversBowled: `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`,
              batted,
              bowled,
              strikeRate: ballsFaced > 0 ? ((runsScored / ballsFaced) * 100).toFixed(1) : '0.0'
            });
          }
        });

        setAnalyticsData({ 
          player, 
          matchPerformances: matchPerformances.reverse(), 
          aggregatedWagonWheel,
          monthlyStats: Object.entries(monthlyStats)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6)
            .reverse()
        });
      } catch (err) {
        console.error("Could not fetch player analytics", err);
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayerData();
  }, [selectedPlayerName, userRole]);

  useEffect(() => {
    if (analyticsData?.player) {
      const { player } = analyticsData;
      setFormData({
        name: player.name || displayName,
        location: player.location || 'New Delhi, India',
        role: player.role || 'All-Rounder',
        teamName: player.team || 'Dream Team',
        jerseyNumber: player.jerseyNumber || '45',
        batterType: player.batterType || 'Right-hand Bat',
        bowlerType: player.bowlerType || 'Right-arm Off Spin',
      });
      if (player.photoUrl) {
        setPhotoUrl(player.photoUrl);
      }
      if (player._id) {
        setCurrentPlayerId(player._id);
      }
    }
  }, [analyticsData, displayName]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    try {
      console.log('Saving profile...', { userName, currentPlayerId, analyticsData, formData });
      
      let playerId = null;
      
      if (userName) {
        try {
          const playersRes = await API.get('/players');
          const player = playersRes.data.find(p => p.name === userName);
          if (player?._id) {
            playerId = player._id;
            setCurrentPlayerId(playerId);
          }
        } catch (err) {
          console.error('Failed to fetch players', err);
        }
      }
      
      if (!playerId) {
        playerId = analyticsData?.player?._id;
        if (playerId) {
          setCurrentPlayerId(playerId);
        }
      }
      
      if (playerId) {
        console.log('Updating player with ID:', playerId, 'Data:', formData);
        await API.put(`/players/${playerId}`, formData);
        alert('✅ Profile updated successfully!');
        setIsEditing(false);
        window.location.reload();
      } else {
        console.log('Player not found, creating new profile...');
        try {
          let teamId = null;
          const teamName = formData.teamName || 'Dream Team';
          
          if (teamName && teamName !== 'No Team') {
            try {
              console.log('Looking for team:', teamName);
              const teamsRes = await API.get('/teams');
              const existingTeam = teamsRes.data.find(t => t.name === teamName);
              
              if (existingTeam) {
                teamId = existingTeam._id;
                console.log('Using existing team:', existingTeam.name, 'ID:', teamId);
              } else {
                console.log('Creating new team:', teamName);
                const newTeamRes = await API.post('/teams', { 
                  name: teamName, 
                  players: []
                });
                teamId = newTeamRes.data._id;
                console.log('Team created with ID:', teamId);
              }
            } catch (teamErr) {
              console.error('Team handling failed:', teamErr);
            }
          }

          console.log('Creating player with team name:', teamName);
          const createRes = await API.post('/players', {
            name: formData.name || userName || 'User',
            team: teamName,
            ...formData
          });
          
          console.log('Create response:', createRes.data);
          
          if (createRes.data?._id || createRes.data?.player?._id) {
            const newPlayerId = createRes.data._id || createRes.data.player._id;
            setCurrentPlayerId(newPlayerId);
            alert('✅ Profile created successfully!');
            setIsEditing(false);
            window.location.reload();
          } else {
            throw new Error('Failed to create player - no ID in response');
          }
        } catch (createErr) {
          console.error('Failed to create player', createErr);
          const errorMsg = createErr.response?.data?.message || createErr.message || 'Unknown error';
          alert('❌ Failed to create player profile: ' + errorMsg + '\n\nPlease try again or contact support if the issue persists.');
        }
      }
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('❌ Failed to update profile: ' + (err.response?.data?.message || err.message));
    }
  };

  const getProfileStats = () => {
    if (!analyticsData) return null;
    const { player, matchPerformances } = analyticsData;
    const battedInnings = matchPerformances.filter(p => p.batted).length;
    const bowledInnings = matchPerformances.filter(p => p.bowled).length;

    const notOuts = 0;
    const highestScore = matchPerformances.reduce((max, p) => p.runsScored > max ? p.runsScored : max, 0);

    const bestBowling = matchPerformances.reduce((best, p) => {
      if (p.wicketsTaken > best.wickets || (p.wicketsTaken === best.wickets && p.runsConceded < best.runs)) {
        return { wickets: p.wicketsTaken, runs: p.runsConceded };
      }
      return best;
    }, { wickets: 0, runs: Infinity });
    const bestBowlingStr = bestBowling.wickets > 0 ? `${bestBowling.wickets}/${bestBowling.runs}` : '-';

    const strikeRate = player.batting?.balls > 0 ? ((player.batting.runs / player.batting.balls) * 100).toFixed(1) : "0.0";
    const dismissals = battedInnings - notOuts;
    const battingAvg = dismissals > 0 ? ((player.batting?.runs || 0) / dismissals).toFixed(2) : "0.00";
    const economy = player.bowling?.balls > 0 ? (player.bowling.runs / (player.bowling.balls / 6)).toFixed(1) : "0.0";
    const bowlingAvg = player.bowling?.wickets > 0 ? ((player.bowling?.runs || 0) / player.bowling.wickets).toFixed(2) : "0.00";

    const fiftyPlus = matchPerformances.filter(p => p.runsScored >= 50).length;
    const hundredPlus = matchPerformances.filter(p => p.runsScored >= 100).length;
    const fiveWicketHauls = matchPerformances.filter(p => p.wicketsTaken >= 5).length;

    return {
      matches: matchPerformances.length,
      runs: player.batting?.runs || 0,
      wickets: player.bowling?.wickets || 0,
      highestScore,
      bestBowlingStr,
      strikeRate,
      battingAvg,
      economy,
      bowlingAvg,
      battedInnings,
      bowledInnings,
      fours: player.batting?.fours || 0,
      sixes: player.batting?.sixes || 0,
      catches: player.fielding?.catches || 0,
      runOuts: player.fielding?.runOuts || 0,
      stumpings: player.fielding?.stumpings || 0,
      overs: `${Math.floor((player.bowling?.balls || 0) / 6)}.${(player.bowling?.balls || 0) % 6}`,
      fiftyPlus,
      hundredPlus,
      fiveWicketHauls
    };
  };

  const profileStats = getProfileStats();

  const renderMomentumGraph = (performances, statKey, maxVal, color) => {
    if (!performances || performances.length === 0) return <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No data</p>;
    const maxValue = Math.max(...performances.map(p => Number(p[statKey])), maxVal);

    return (
      <div className="analytics-chart" style={{ display: 'flex', gap: '8px', height: '150px', alignItems: 'flex-end', padding: '10px 0', borderBottom: '2px solid #e2e8f0' }}>
        {performances.map((perf, i) => {
          const heightPct = maxValue > 0 ? (Number(perf[statKey]) / maxValue) * 100 : 0;
          const vsTeamShort = perf.vsTeam ? perf.vsTeam.substring(0, 3).toUpperCase() : `M${i + 1}`;
          return (
            <div key={perf.matchId || i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }} title={`vs ${perf.vsTeam}: ${perf[statKey]}`}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    backgroundColor: color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    minHeight: heightPct > 0 ? '4px' : '0'
                  }}
                ></div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontWeight: '600' }}>{vsTeamShort}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const getTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'statistics', label: 'Statistics', icon: '📈' },
      { id: 'matches', label: 'Matches', icon: '🏏' },
      { id: 'achievements', label: 'Achievements', icon: '🏆' },
      { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];
    return tabs;
  };

  const navTabs = getTabs();

  const getPerformanceLevel = () => {
    if (!profileStats) return { level: 'Beginner', color: '#64748b', progress: 10 };
    const score = (profileStats.matches * 2) + (profileStats.runs / 10) + (profileStats.wickets * 5);
    if (score >= 500) return { level: 'Legend', color: '#fbbf24', progress: 100 };
    if (score >= 300) return { level: 'Expert', color: '#8b5cf6', progress: 75 };
    if (score >= 150) return { level: 'Advanced', color: '#0ea5e9', progress: 50 };
    if (score >= 50) return { level: 'Intermediate', color: '#10b981', progress: 25 };
    return { level: 'Beginner', color: '#64748b', progress: 10 };
  };

  const performanceLevel = getPerformanceLevel();

  if (loading) {
    return (
      <div className="profile-page">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #003a6c',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading your profile...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!analyticsData || !profileStats) {
    return (
      <div className="profile-page">
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem', opacity: 0.6 }}>👤</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.75rem' }}>
            No Player Profile Found
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Start playing matches to build your cricket profile and track your performance statistics.
          </p>
          <button 
            onClick={() => setIsEditing(true)}
            style={{
              padding: '0.875rem 2rem',
              background: 'linear-gradient(135deg, #003a6c, #0ea5e9)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 58, 108, 0.3)'
            }}
          >
            Create Your Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Hero Section */}
      <div className="profile-hero">
        <div 
          className="cover-photo" 
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0, 58, 108, 0.9) 0%, rgba(14, 165, 233, 0.8) 100%)'
          }}></div>
        </div>
        
        {/* Player Selector */}
        {allPlayersFromTeams.length > 1 && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '2rem',
            zIndex: 20
          }}>
            <div style={{
              background: 'white',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              border: '2px solid #003a6c'
            }}>
              <label style={{ 
                fontSize: '0.85rem', 
                fontWeight: '700', 
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}>
                <span style={{ fontSize: '1.1rem' }}>👤</span>
                View:
              </label>
              <select 
                value={selectedPlayerName}
                onChange={(e) => setSelectedPlayerName(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.9rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: 'white',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#0f172a',
                  minWidth: '150px'
                }}
              >
                {allPlayersFromTeams.map(playerName => (
                  <option key={playerName} value={playerName}>{playerName}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        <div className="profile-info-container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="profile-avatar" style={{ 
            position: 'relative',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #003a6c, #0ea5e9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: '700',
            color: 'white',
            boxShadow: '0 12px 32px rgba(0, 58, 108, 0.5)',
            border: '5px solid white',
            overflow: 'hidden'
          }}>
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="profile-details">
            <div className="profile-title">
              <h2 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '800',
                color: 'white',
                textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                marginBottom: '0.75rem'
              }}>
                {displayName}
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span 
                  className="verified-badge" 
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.375rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: '600'
                  }}
                >
                  ✓ Verified Player
                </span>
                <span style={{
                  padding: '0.375rem 1rem',
                  background: 'rgba(59, 130, 246, 0.3)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  color: 'white',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  fontWeight: '600'
                }}>
                  {userRole}
                </span>
              </div>
            </div>
            
            <p className="profile-subtitle" style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '1rem',
              marginTop: '1rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <span>📍 {analyticsData?.player?.location || formData.location}</span>
              {userRole === 'Player' && (
                <>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span>🏏 {analyticsData?.player?.role || formData.role}</span>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span>👕 {analyticsData?.player?.team || formData.teamName} #{analyticsData?.player?.jerseyNumber || formData.jerseyNumber}</span>
                </>
              )}
            </p>
            
            <div className="profile-tags" style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {userRole === 'Player' && (
                <>
                  <span style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    {analyticsData?.player?.batterType || formData.batterType}
                  </span>
                  <span style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    {analyticsData?.player?.bowlerType || formData.bowlerType}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="profile-actions" style={{ marginTop: '2rem' }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <button 
                className="button secondary" 
                onClick={() => alert(`Link to ${displayName}'s profile copied to clipboard!`)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Share Profile
              </button>
              <button 
                className="button primary" 
                onClick={() => setActiveTab('settings')}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#003a6c',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Edit Profile
              </button>
              <button 
                className="button danger" 
                onClick={onLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Level Badge */}
      <div style={{
        maxWidth: '1200px',
        margin: '-30px auto 0',
        position: 'relative',
        zIndex: 10,
        padding: '0 2rem'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          boxShadow: '0 10px 40px rgba(0, 58, 108, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${performanceLevel.color}40, ${performanceLevel.color}20)`,
              border: `3px solid ${performanceLevel.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem'
            }}>
              ⭐
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>PERFORMANCE LEVEL</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: performanceLevel.color }}>{performanceLevel.level}</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '400px' }}>
            <div style={{
              height: '12px',
              background: '#e2e8f0',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                height: '100%',
                width: `${performanceLevel.progress}%`,
                background: `linear-gradient(90deg, ${performanceLevel.color}, ${performanceLevel.color}dd)`,
                borderRadius: '6px',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'right' }}>{profileStats.matches} matches played</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-nav" style={{
        background: 'var(--bg-card)',
        borderBottom: '2px solid var(--border)',
        padding: '0 2rem',
        marginTop: '2rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        {navTabs.map(tab => (
          <button 
            key={tab.id} 
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '1.25rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #003a6c' : '3px solid transparent',
              color: activeTab === tab.id ? '#003a6c' : '#64748b',
              fontWeight: activeTab === tab.id ? '700' : '500',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content animate-fade-in" style={{ padding: '2rem', background: 'var(--bg-secondary)', minHeight: '400px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Left: FIFA Player Card (only if player is found) */}
            {analyticsData?.player && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, margin: '0 auto', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <PlayerCard player={analyticsData.player} matchPerformances={analyticsData.matchPerformances} />
                <button 
                  className="button secondary compact-button" 
                  style={{ marginTop: '0.75rem', width: '100%', maxWidth: '280px', fontWeight: 'bold' }}
                  onClick={() => {
                    alert(`Player Card of ${analyticsData.player.name} is ready for share! Code: CMS-${analyticsData.player._id.slice(-6)}`);
                  }}
                >
                  🔗 Share Player Card
                </button>
              </div>
            )}

            {/* Right: Stats & Matches */}
            <div style={{ flex: 1, minWidth: '320px', display: 'grid', gap: '2rem' }}>
              {/* Quick Stats */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                gap: '1.25rem' 
              }}>
                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                  border: '2px solid #bae6fd',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏏</div>
                  <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Matches</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#003a6c' }}>{profileStats.matches}</div>
                </div>
                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                  border: '2px solid #fed7aa',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                  <div style={{ fontSize: '0.8rem', color: '#c2410c', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Runs</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#9a3412' }}>{profileStats.runs}</div>
                </div>
                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, #f5f3ff, #e9d5ff)',
                  border: '2px solid #d8b4fe',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
                  <div style={{ fontSize: '0.8rem', color: '#7e22ce', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>High Score</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#6b21a8' }}>{profileStats.highestScore}</div>
                </div>
                <div className="stat-card" style={{
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  border: '2px solid #bbf7d0',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
                  <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wickets</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#166534' }}>{profileStats.wickets}</div>
                </div>
              </div>

              {/* Recent Performance */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--border)'
              }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#003a6c', borderRadius: '2px' }}></span>
                  Recent Matches
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {analyticsData.matchPerformances.slice(0, 5).map((perf, idx) => (
                    <div key={perf.matchId || idx} style={{
                      padding: '1.25rem',
                      background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-muted))',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ 
                          fontWeight: '700', 
                          color: '#0f172a',
                          fontSize: '1rem',
                          marginBottom: '0.5rem'
                        }}>
                          vs {perf.vsTeam}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <span>📅 {perf.date.toLocaleDateString()}</span>
                          <span>🏆 {perf.tournament}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        {perf.batted && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>BATTING</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>{perf.runsScored}({perf.ballsFaced})</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>SR: {perf.strikeRate}</div>
                          </div>
                        )}
                        {perf.bowled && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>BOWLING</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>{perf.wicketsTaken}/{perf.runsConceded}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{perf.oversBowled} ov</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* Career Summary */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #003a6c 0%, #0ea5e9 100%)',
                padding: '1.5rem 2rem',
                color: 'white'
              }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.75rem' }}>📊</span>
                  Career Statistics
                </h3>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.95, fontSize: '0.9rem' }}>
                  Complete performance overview
                </p>
              </div>
              
              <div style={{ padding: '2rem' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '1.25rem' 
                }}>
                  <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '2px solid #bae6fd'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Matches</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#003a6c' }}>{profileStats.matches}</div>
                  </div>
                  <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '2px solid #fed7aa'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#c2410c', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Runs</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#9a3412' }}>{profileStats.runs}</div>
                  </div>
                  <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #f5f3ff, #e9d5ff)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '2px solid #d8b4fe'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#7e22ce', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>High Score</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#6b21a8' }}>{profileStats.highestScore}</div>
                  </div>
                  <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '2px solid #bbf7d0'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Wickets</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#166534' }}>{profileStats.wickets}</div>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                  gap: '1rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '2px solid #e2e8f0'
                }}>
                  <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>BATTING AVG</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{profileStats.battingAvg}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>STRIKE RATE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{profileStats.strikeRate}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>BEST BOWLING</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{profileStats.bestBowlingStr}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>ECONOMY</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{profileStats.economy}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Batting Stats */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#f59e0b', borderRadius: '2px' }}></span>
                Batting Statistics
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1rem' 
              }}>
                {[
                  { label: 'Innings', value: profileStats.battedInnings, icon: '🏏' },
                  { label: 'Runs', value: profileStats.runs, icon: '⚡' },
                  { label: 'Average', value: profileStats.battingAvg, icon: '📊' },
                  { label: 'Strike Rate', value: profileStats.strikeRate, icon: '🚀' },
                  { label: 'Highest', value: profileStats.highestScore, icon: '🎯' },
                  { label: '50+ Scores', value: profileStats.fiftyPlus, icon: '⭐' },
                  { label: '100+ Scores', value: profileStats.hundredPlus, icon: '🌟' },
                  { label: '4s / 6s', value: `${profileStats.fours} / ${profileStats.sixes}`, icon: '💥' }
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bowling Stats */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#10b981', borderRadius: '2px' }}></span>
                Bowling Statistics
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1rem' 
              }}>
                {[
                  { label: 'Innings', value: profileStats.bowledInnings, icon: '🎯' },
                  { label: 'Wickets', value: profileStats.wickets, icon: '🏆' },
                  { label: 'Average', value: profileStats.bowlingAvg, icon: '📊' },
                  { label: 'Economy', value: profileStats.economy, icon: '💨' },
                  { label: 'Best Bowling', value: profileStats.bestBowlingStr, icon: '⭐' },
                  { label: '5-Wicket Hauls', value: profileStats.fiveWicketHauls, icon: '🌟' },
                  { label: 'Overs', value: profileStats.overs, icon: '⏱️' }
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fielding Stats */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#8b5cf6', borderRadius: '2px' }}></span>
                Fielding Statistics
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1rem' 
              }}>
                {[
                  { label: 'Catches', value: profileStats.catches, icon: '🧤' },
                  { label: 'Run Outs', value: profileStats.runOuts, icon: '🎯' },
                  { label: 'Stumpings', value: profileStats.stumpings, icon: '🥅' }
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Analytics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
              marginTop: '2rem'
            }}>
              {/* Wagon Wheel */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#3b82f6', borderRadius: '2px' }}></span>
                  Career Wagon Wheel
                </h3>
                <div style={{ width: '100%', maxWidth: '320px' }}>
                  <WagonWheel wagonWheelData={analyticsData.aggregatedWagonWheel || {}} />
                </div>
              </div>

              {/* Batting Trend */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--border)'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#38bdf8', borderRadius: '2px' }}></span>
                  Batting Form (Runs per Match)
                </h3>
                {renderMomentumGraph(analyticsData.matchPerformances.filter(p => p.batted), 'runsScored', 10, '#38bdf8')}
              </div>

              {/* Bowling Trend */}
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--border)'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#a855f7', borderRadius: '2px' }}></span>
                  Bowling Form (Wickets per Match)
                </h3>
                {renderMomentumGraph(analyticsData.matchPerformances.filter(p => p.bowled), 'wicketsTaken', 3, '#a855f7')}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--border)'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#003a6c', borderRadius: '2px' }}></span>
                Match History
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {analyticsData.matchPerformances.length > 0 ? (
                  analyticsData.matchPerformances.map((perf) => (
                    <div key={perf.matchId} style={{
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-muted))',
                      borderRadius: '12px',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                            vs {perf.vsTeam}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span>📅 {perf.date.toLocaleDateString()}</span>
                            <span>🏆 {perf.tournament}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        {perf.batted && (
                          <div style={{
                            padding: '1rem',
                            background: 'var(--bg-card)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Batting</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
                              {perf.runsScored} ({perf.ballsFaced})
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              SR: {perf.strikeRate} • 4s: {perf.fours} • 6s: {perf.sixes}
                            </div>
                          </div>
                        )}
                        {perf.bowled && (
                          <div style={{
                            padding: '1rem',
                            background: 'var(--bg-card)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Bowling</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
                              {perf.wicketsTaken}/{perf.runsConceded}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              {perf.oversBowled} ov
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '3rem' }}>No matches played yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--border)'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ display: 'inline-block', width: '4px', height: '22px', background: '#fbbf24', borderRadius: '2px' }}></span>
                Awards & Achievements
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem' 
              }}>
                {[
                  { 
                    icon: '🏆', 
                    title: 'Man of the Series', 
                    event: 'Summer Cup 2025',
                    unlocked: profileStats.matches >= 5,
                    description: 'Awarded for outstanding all-round performance'
                  },
                  { 
                    icon: '⭐', 
                    title: 'Best Batsman', 
                    event: 'Winter League 2024',
                    unlocked: profileStats.runs >= 100,
                    description: 'Top run-scorer of the tournament'
                  },
                  { 
                    icon: '🎯', 
                    title: 'Fastest 50', 
                    event: 'Weekend Bash 2024',
                    unlocked: profileStats.highestScore >= 50,
                    description: 'Scored 50 runs in under 30 balls'
                  },
                  { 
                    icon: '🌟', 
                    title: 'Century Maker', 
                    event: 'Premier League 2024',
                    unlocked: profileStats.hundredPlus > 0,
                    description: 'Scored 100+ runs in a single match'
                  },
                  { 
                    icon: '💪', 
                    title: 'Five Wicket Haul', 
                    event: 'T20 Blast 2024',
                    unlocked: profileStats.fiveWicketHauls > 0,
                    description: 'Took 5 or more wickets in an innings'
                  },
                  { 
                    icon: '🎖️', 
                    title: 'Consistent Performer', 
                    event: 'All Formats',
                    unlocked: profileStats.matches >= 10,
                    description: 'Played 10+ matches with good performance'
                  }
                ].map((achievement, idx) => (
                  <div key={idx} style={{
                    padding: '1.5rem',
                    background: achievement.unlocked 
                      ? 'linear-gradient(135deg, #fef3c7, #fde68a)' 
                      : 'linear-gradient(135deg, var(--bg-secondary), var(--bg-muted))',
                    borderRadius: '12px',
                    border: achievement.unlocked ? '2px solid #fcd34d' : '1px solid var(--border)',
                    textAlign: 'center',
                    opacity: achievement.unlocked ? 1 : 0.6,
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ 
                      fontSize: '3rem', 
                      marginBottom: '1rem',
                      filter: achievement.unlocked ? 'none' : 'grayscale(100%)'
                    }}>{achievement.icon}</div>
                    <div style={{ 
                      fontWeight: '700', 
                      color: '#78350f', 
                      fontSize: '1.1rem', 
                      marginBottom: '0.5rem' 
                    }}>
                      {achievement.title}
                    </div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: '#92400e',
                      marginBottom: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {achievement.event}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#64748b',
                      lineHeight: 1.5
                    }}>
                      {achievement.description}
                    </div>
                    {!achievement.unlocked && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem',
                        background: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        fontWeight: '600'
                      }}>
                        🔒 Locked
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>Profile Settings</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Update your {userRole.toLowerCase()} details and account information.</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #003a6c, #0ea5e9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(0, 58, 108, 0.3)'
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              {/* Personal Information Card */}
              <div style={{
                background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-muted))',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid var(--border)',
                gridColumn: 'span 2'
              }}>
                <h4 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '700', 
                  color: '#0f172a',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '4px', 
                    height: '20px', 
                    background: '#003a6c', 
                    borderRadius: '2px' 
                  }}></span>
                  Personal Information
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Display Name</label>
                    <input 
                      className="input" 
                      type="text" 
                      name="name" 
                      value={formData.name || ''} 
                      onChange={handleFormChange}
                      disabled={!isEditing}
                      style={{ 
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem',
                        border: isEditing ? '2px solid #003a6c' : '1px solid var(--border)',
                        borderRadius: '10px',
                        background: isEditing ? 'var(--bg-card)' : 'var(--bg-secondary)',
                        opacity: isEditing ? 1 : 0.6,
                        transition: 'all 0.2s'
                      }} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Email Address</label>
                    <input 
                      className="input" 
                      type="email" 
                      defaultValue={userEmail} 
                      readOnly 
                      style={{ 
                        background: 'var(--bg-muted)', 
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        cursor: 'not-allowed',
                        opacity: 0.7,
                        color: '#64748b'
                      }} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>Profile Photo</label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #003a6c, #0ea5e9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '1.25rem',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {photoUrl ? (
                          <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <input 
                        className="input" 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload}
                        disabled={!isEditing}
                        style={{ 
                          flex: 1,
                          padding: '0.625rem',
                          fontSize: '0.875rem',
                          border: isEditing ? '2px solid #003a6c' : '1px solid var(--border)',
                          borderRadius: '8px',
                          background: isEditing ? 'var(--bg-card)' : 'var(--bg-secondary)',
                          opacity: isEditing ? 1 : 0.6,
                          cursor: isEditing ? 'pointer' : 'not-allowed'
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cricket Information Card */}
              {userRole === 'Player' && (
                <div style={{
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #fcd34d',
                  gridColumn: 'span 2'
                }}>
                  <h4 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '700', 
                    color: '#78350f',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>🏏</span>
                    Cricket Information
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: '600', color: '#92400e', fontSize: '0.9rem' }}>Primary Team</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          className="input" 
                          type="text" 
                          name="teamName" 
                          list="team-list"
                          value={formData.teamName || ''} 
                          onChange={handleFormChange}
                          disabled={!isEditing}
                          placeholder={isEditing ? "Select or type a team name..." : "No team selected"}
                          style={{ 
                            width: '100%',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            border: isEditing ? '2px solid #f59e0b' : '2px solid #fcd34d',
                            borderRadius: '10px',
                            background: isEditing ? 'white' : '#fef3c7',
                            fontWeight: '500',
                            cursor: isEditing ? 'text' : 'not-allowed'
                          }}
                        />
                        <datalist id="team-list">
                          {availableTeams.map(team => (
                            <option key={team._id} value={team.name}>
                              {team.name} ({team.players?.length || 0} players)
                            </option>
                          ))}
                        </datalist>
                      </div>
                      {availableTeams.length === 0 && isEditing && (
                        <p style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          💡 Type a team name to create it automatically
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: '600', color: '#92400e', fontSize: '0.9rem' }}>Location</label>
                      <select 
                        className="input" 
                        name="location" 
                        value={formData.location || ''} 
                        onChange={handleFormChange}
                        disabled={!isEditing}
                        style={{ 
                          width: '100%',
                          padding: '0.75rem 1rem',
                          fontSize: '0.95rem',
                          border: isEditing ? '2px solid #f59e0b' : '2px solid #fcd34d',
                          borderRadius: '10px',
                          background: isEditing ? 'white' : '#fef3c7',
                          opacity: isEditing ? 1 : 0.6,
                          cursor: isEditing ? 'pointer' : 'not-allowed',
                          fontWeight: '500'
                        }}
                      >
                        <option value="">Select location...</option>
                        <option value="Mumbai, India">📍 Mumbai, India</option>
                        <option value="Delhi, India">📍 Delhi, India</option>
                        <option value="Bangalore, India">📍 Bangalore, India</option>
                        <option value="Chennai, India">📍 Chennai, India</option>
                        <option value="Kolkata, India">📍 Kolkata, India</option>
                        <option value="Hyderabad, India">📍 Hyderabad, India</option>
                        <option value="Pune, India">📍 Pune, India</option>
                        <option value="Ahmedabad, India">📍 Ahmedabad, India</option>
                        <option value="Jaipur, India">📍 Jaipur, India</option>
                        <option value="Lucknow, India">📍 Lucknow, India</option>
                        <option value="Other">✏️ Other (Custom)</option>
                      </select>
                      {formData.location === 'Other' && isEditing && (
                        <input 
                          className="input" 
                          type="text" 
                          placeholder="Enter custom location..."
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          disabled={!isEditing}
                          style={{ 
                            width: '100%',
                            marginTop: '0.5rem',
                            padding: '0.75rem 1rem',
                            fontSize: '0.95rem',
                            border: '2px solid #f59e0b',
                            borderRadius: '10px',
                            background: 'white',
                            opacity: isEditing ? 1 : 0.6
                          }} 
                        />
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: '600', color: '#92400e', fontSize: '0.9rem' }}>Jersey Number</label>
                      <input 
                        className="input" 
                        type="number" 
                        name="jerseyNumber" 
                        value={formData.jerseyNumber || ''} 
                        onChange={handleFormChange}
                        disabled={!isEditing}
                        style={{ 
                          width: '100%',
                          padding: '0.75rem 1rem',
                          fontSize: '0.95rem',
                          border: isEditing ? '2px solid #f59e0b' : '2px solid #fcd34d',
                          borderRadius: '10px',
                          background: isEditing ? 'white' : '#fef3c7',
                          opacity: isEditing ? 1 : 0.6
                        }} 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: '600', color: '#92400e', fontSize: '0.9rem' }}>Playing Role</label>
                      <select 
                        className="input" 
                        name="role" 
                        value={formData.role || ''} 
                        onChange={handleFormChange}
                        disabled={!isEditing}
                        style={{ 
                          width: '100%',
                          padding: '0.75rem 1rem',
                          fontSize: '0.95rem',
                          border: isEditing ? '2px solid #f59e0b' : '2px solid #fcd34d',
                          borderRadius: '10px',
                          background: isEditing ? 'white' : '#fef3c7',
                          opacity: isEditing ? 1 : 0.6,
                          cursor: isEditing ? 'pointer' : 'not-allowed',
                          fontWeight: '500'
                        }}
                      >
                        <option value="Batsman">🏏 Batsman</option>
                        <option value="Bowler">🎯 Bowler</option>
                        <option value="All-Rounder">⭐ All-Rounder</option>
                        <option value="Wicket Keeper">🧤 Wicket Keeper</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: '600', color: '#92400e', fontSize: '0.9rem' }}>Batting Style</label>
                      <select 
                        className="input" 
                        name="batterType" 
                        value={formData.batterType || ''} 
                        onChange={handleFormChange}
                        disabled={!isEditing}
                        style={{ 
                          width: '100%',
                          padding: '0.75rem 1rem',
                          fontSize: '0.95rem',
                          border: isEditing ? '2px solid #f59e0b' : '2px solid #fcd34d',
                          borderRadius: '10px',
                          background: isEditing ? 'white' : '#fef3c7',
                          opacity: isEditing ? 1 : 0.6,
                          cursor: isEditing ? 'pointer' : 'not-allowed',
                          fontWeight: '500'
                        }}
                      >
                        <option value="Right-hand Bat">🖐️ Right-hand Bat</option>
                        <option value="Left-hand Bat">🖐️ Left-hand Bat</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: '600', color: '#92400e', fontSize: '0.9rem' }}>Bowling Style</label>
                      <select 
                        className="input" 
                        name="bowlerType" 
                        value={formData.bowlerType || ''} 
                        onChange={handleFormChange}
                        disabled={!isEditing}
                        style={{ 
                          width: '100%',
                          padding: '0.75rem 1rem',
                          fontSize: '0.95rem',
                          border: isEditing ? '2px solid #f59e0b' : '2px solid #fcd34d',
                          borderRadius: '10px',
                          background: isEditing ? 'white' : '#fef3c7',
                          opacity: isEditing ? 1 : 0.6,
                          cursor: isEditing ? 'pointer' : 'not-allowed',
                          fontWeight: '500'
                        }}
                      >
                        <option value="Right-arm Fast">💪 Right-arm Fast</option>
                        <option value="Right-arm Medium">💪 Right-arm Medium</option>
                        <option value="Right-arm Off Spin">🌀 Right-arm Off Spin</option>
                        <option value="Right-arm Leg Spin">🌀 Right-arm Leg Spin</option>
                        <option value="Left-arm Fast">💪 Left-arm Fast</option>
                        <option value="Left-arm Orthodox">🌀 Left-arm Orthodox</option>
                        <option value="Left-arm Chinaman">🌀 Left-arm Chinaman</option>
                        <option value="None">N/A</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {isEditing && (
                <div style={{ 
                  gridColumn: '1 / -1', 
                  display: 'flex', 
                  gap: '1rem',
                  marginTop: '1rem',
                  padding: '1.5rem',
                  background: 'white',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  justifyContent: 'flex-end'
                }}>
                  <button 
                    className="button secondary" 
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '0.875rem 2rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      background: 'white',
                      color: '#64748b',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="button primary" 
                    onClick={handleSaveChanges}
                    style={{
                      padding: '0.875rem 2rem',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #003a6c, #0ea5e9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 58, 108, 0.3)',
                      transition: 'all 0.2s'
                    }}
                  >
                    💾 Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;