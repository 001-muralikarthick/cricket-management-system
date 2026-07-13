const express = require("express");
const router = express.Router();
const Player = require("../models/Player");
const Team = require("../models/Team");
const Match = require("../models/Match");

// GET ALL PLAYERS
router.get("/", async (req, res) => {
  try {
    const players = await Player.find().lean();
    const matches = await Match.find().lean();

    // 1. Calculate how many matches each team has played
    const teamMatchCount = {};
    matches.forEach(m => {
      if (m.teamA) teamMatchCount[m.teamA] = (teamMatchCount[m.teamA] || 0) + 1;
      if (m.teamB) teamMatchCount[m.teamB] = (teamMatchCount[m.teamB] || 0) + 1;
    });

    // 2. Attach match count to each player based on their team
    const enrichedPlayers = players.map(p => {
      let matchesPlayed = p.team ? (teamMatchCount[p.team] || 0) : 0;
      
      // 3. Absolute Safety Fallback: if matches were deleted but they still have stats
      const batBalls = p.batting?.balls || 0;
      const bowlOvers = p.bowling?.overs || 0;
      if (matchesPlayed === 0 && (batBalls > 0 || bowlOvers > 0)) {
        matchesPlayed = 1; 
      }

      return {
        ...p,
        matches: matchesPlayed
      };
    });

    // Sort by runs by default for a cleaner overall view
    enrichedPlayers.sort((a, b) => (b.batting?.runs || 0) - (a.batting?.runs || 0));

    res.json(enrichedPlayers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE PLAYER
router.put("/:id", async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(player);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD COMPLETED MATCH STATS TO PLAYER CAREER STATS
router.post("/commit-match-stats", async (req, res) => {
  try {
    const { innings = [] } = req.body;

    for (const item of innings) {
      const battingStats = item.battingStats || {};
      const bowlingStats = item.bowlingStats || {};
      const battingTeam = item.battingTeam || item.team;
      const bowlingTeam = item.bowlingTeam;

      for (const [name, stats] of Object.entries(battingStats)) {
        await Player.findOneAndUpdate(
          { name, team: battingTeam },
          {
            $inc: {
              "batting.runs": stats.runs || 0,
              "batting.balls": stats.balls || 0,
              "batting.fours": stats.fours || 0,
              "batting.sixes": stats.sixes || 0
            }
          }
        );
      }

      for (const [name, stats] of Object.entries(bowlingStats)) {
        await Player.findOneAndUpdate(
          { name, team: bowlingTeam },
          {
            $inc: {
              "bowling.overs": (stats.balls || 0) / 6,
              "bowling.runs": stats.runs || 0,
              "bowling.wickets": stats.wickets || 0
            }
          }
        );
      }
    }

    res.json({ message: "Player stats updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE PLAYER AND ADD TO TEAM
router.post("/", async (req, res) => {
  try {
    const { name, teamId, team } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Player name is required" });
    }

    let selectedTeam = null;

    if (teamId) {
      selectedTeam = await Team.findById(teamId);
    } else if (team) {
      selectedTeam = await Team.findOne({ name: team });
    }

    if (!selectedTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    const playerName = name.trim();
    const player = await Player.create({
      name: playerName,
      team: selectedTeam.name
    });

    if (!selectedTeam.players.includes(playerName)) {
      selectedTeam.players.push(playerName);
      await selectedTeam.save();
    }

    res.status(201).json({ player, team: selectedTeam });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE PLAYER PROFILE
router.get("/:id", async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json(player);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET PLAYER ANALYTICS
router.get("/:id/analytics", async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found" });

    // Fetch all completed matches
    const matches = await Match.find({ matchResult: { $ne: "" } }).lean();

    const matchPerformances = [];

    matches.forEach(match => {
      let batted = false;
      let bowled = false;
      let runsScored = 0;
      let ballsFaced = 0;
      let fours = 0;
      let sixes = 0;
      let wicketsTaken = 0;
      let runsConceded = 0;
      let ballsBowled = 0;

      // Helper function to process an innings
      const processInnings = (battingStats, bowlingStats) => {
        if (battingStats && battingStats[player.name]) {
          batted = true;
          runsScored += battingStats[player.name].runs || 0;
          ballsFaced += battingStats[player.name].balls || 0;
          fours += battingStats[player.name].fours || 0;
          sixes += battingStats[player.name].sixes || 0;
        }

        if (bowlingStats && bowlingStats[player.name]) {
          bowled = true;
          wicketsTaken += bowlingStats[player.name].wickets || 0;
          runsConceded += bowlingStats[player.name].runs || 0;
          ballsBowled += bowlingStats[player.name].balls || 0;
        }
      };

      // Check first innings
      if (match.firstInnings) {
        processInnings(match.firstInnings.battingStats, match.firstInnings.bowlingStats);
      } else if (match.innings === 1) { // Legacy fallback
        processInnings(match.battingStats, match.bowlingStats);
      }

      // Check second innings (the current match state if innings 2)
      if (match.innings === 2) {
        processInnings(match.battingStats, match.bowlingStats);
      }

      if (batted || bowled) {
        matchPerformances.push({
          matchId: match._id,
          date: match.createdAt || new Date(),
          teamA: match.teamA,
          teamB: match.teamB,
          batted,
          runsScored,
          ballsFaced,
          fours,
          sixes,
          strikeRate: ballsFaced > 0 ? ((runsScored / ballsFaced) * 100).toFixed(2) : 0,
          bowled,
          wicketsTaken,
          runsConceded,
          oversBowled: Math.floor(ballsBowled / 6) + (ballsBowled % 6) / 10,
          economy: ballsBowled > 0 ? (runsConceded / (ballsBowled / 6)).toFixed(2) : 0
        });
      }
    });

    res.json({
      player,
      matchPerformances
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
