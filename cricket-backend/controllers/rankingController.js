const Player = require("../models/Player");
const Match = require("../models/Match");
const Team = require("../models/Team");

// 🟠 ORANGE CAP (TOP RUN SCORERS)
exports.getOrangeCap = async (req, res) => {
  try {
    const players = await Player.find()
      .sort({ "batting.runs": -1 })
      .limit(10);

    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟣 PURPLE CAP (TOP WICKET TAKERS)
exports.getPurpleCap = async (req, res) => {
  try {
    const players = await Player.find()
      .sort({ "bowling.wickets": -1 })
      .limit(10);

    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🏆 TOURNAMENT SPECIFIC RANKINGS
exports.getTournamentRankings = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const matches = await Match.find({ tournament: tournamentId }).lean();
    const allDbPlayers = await Player.find().lean();
    
    let playersMap = {}; 

    const mergeBatting = (name, team, stats) => {
      if (!name) return;
      if (!playersMap[name]) playersMap[name] = { name, team, matches: 0, batting: {runs:0, balls:0, fours:0, sixes:0}, bowling: {overs:0, runs:0, wickets:0} };
      playersMap[name].batting.runs += stats.runs || 0;
      playersMap[name].batting.balls += stats.balls || 0;
      playersMap[name].batting.fours += stats.fours || 0;
      playersMap[name].batting.sixes += stats.sixes || 0;
    };

    const mergeBowling = (name, team, stats) => {
      if (!name) return;
      if (!playersMap[name]) playersMap[name] = { name, team, matches: 0, batting: {runs:0, balls:0, fours:0, sixes:0}, bowling: {overs:0, runs:0, wickets:0} };
      let overs = (stats.balls || 0) / 6; 
      playersMap[name].bowling.overs += overs;
      playersMap[name].bowling.runs += stats.runs || 0;
      playersMap[name].bowling.wickets += stats.wickets || 0;
    };

    const teamMatchCount = {};

    matches.forEach(m => {
      if (m.teamA) teamMatchCount[m.teamA] = (teamMatchCount[m.teamA] || 0) + 1;
      if (m.teamB) teamMatchCount[m.teamB] = (teamMatchCount[m.teamB] || 0) + 1;

      // First innings
      if (m.firstInnings && m.firstInnings.battingStats) {
        Object.entries(m.firstInnings.battingStats).forEach(([pName, pStats]) => {
          mergeBatting(pName, m.firstInnings.battingTeam || m.firstInnings.team || m.teamA, pStats);
        });
      }
      if (m.firstInnings && m.firstInnings.bowlingStats) {
        Object.entries(m.firstInnings.bowlingStats).forEach(([pName, pStats]) => {
          mergeBowling(pName, m.firstInnings.bowlingTeam || m.teamB, pStats);
        });
      }
      
      // Second innings
      if (m.battingStats) {
        Object.entries(m.battingStats).forEach(([pName, pStats]) => {
          let team = m.teamA;
          if (m.firstInnings && (m.firstInnings.team === m.teamA || m.firstInnings.battingTeam === m.teamA)) {
            team = m.teamB;
          }
          mergeBatting(pName, team, pStats);
        });
      }
      if (m.bowlingStats) {
        Object.entries(m.bowlingStats).forEach(([pName, pStats]) => {
          let team = m.teamA;
          if (m.firstInnings && (m.firstInnings.team === m.teamB || m.firstInnings.battingTeam === m.teamB)) {
            team = m.teamB;
          }
          mergeBowling(pName, team, pStats);
        });
      }
    });

    // Make sure we include all players from teams that played in this tournament
    allDbPlayers.forEach(p => {
      if (p.team && teamMatchCount[p.team] && !playersMap[p.name]) {
        playersMap[p.name] = { name: p.name, team: p.team, matches: 0, batting: {runs:0, balls:0, fours:0, sixes:0}, bowling: {overs:0, runs:0, wickets:0} };
      }
    });

    const allPlayers = Object.values(playersMap);

    // Assign match counts based on team appearances
    allPlayers.forEach(p => {
      let matchesPlayed = p.team ? (teamMatchCount[p.team] || 0) : 0;
      const batBalls = p.batting?.balls || 0;
      const bowlOvers = p.bowling?.overs || 0;
      
      if (matchesPlayed === 0 && (batBalls > 0 || bowlOvers > 0)) {
        matchesPlayed = 1;
      }
      p.matches = matchesPlayed;
    });
    
    // Sort
    const orangeCap = [...allPlayers].sort((a, b) => b.batting.runs - a.batting.runs).slice(0, 10);
    const purpleCap = [...allPlayers].sort((a, b) => b.bowling.wickets - a.bowling.wickets).slice(0, 10);

    // Format over to one decimal e.g. 1.5 instead of 1.8333
    allPlayers.forEach(p => {
      p.bowling.overs = Math.round(p.bowling.overs * 10) / 10;
    });

    // Flatten properties for the frontend
    const flattenPlayer = (p) => ({
      ...p,
      runs: p.batting.runs,
      wickets: p.bowling.wickets,
      sixes: p.batting.sixes
    });

    res.json({ 
      allPlayers: allPlayers.map(flattenPlayer), 
      orangeCap: orangeCap.map(flattenPlayer), 
      purpleCap: purpleCap.map(flattenPlayer) 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};