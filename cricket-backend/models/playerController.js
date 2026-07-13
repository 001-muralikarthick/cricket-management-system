const Player = require("../models/Player");
const Team = require("../models/Team");

// @desc    Get all players
// @route   GET /api/players
exports.getPlayers = async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get a single player by ID
// @route   GET /api/players/:id
exports.getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    res.json(player);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new player and add to a team
// @route   POST /api/players
exports.createPlayer = async (req, res) => {
  try {
    const { name, teamId } = req.body;
    if (!name || !teamId) {
      return res.status(400).json({ message: "Player name and teamId are required." });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const existingPlayer = await Player.findOne({ name, team: team.name });
    if (existingPlayer) {
      return res.status(200).json(existingPlayer);
    }

    const player = await Player.create({ name, team: team.name });

    if (!team.players.includes(name)) {
      team.players.push(name);
      await team.save();
    }

    res.status(201).json(player);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update a player's details (role, type, etc.)
// @route   PUT /api/players/:id
exports.updatePlayer = async (req, res) => {
  try {
    const { name, team, ...updates } = req.body;
    const player = await Player.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json(player);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Commit stats from a completed match to player profiles
// @route   POST /api/players/commit-match-stats
exports.commitMatchStats = async (req, res) => {
  try {
    const { innings } = req.body;
    if (!innings || !Array.isArray(innings)) {
      return res.status(400).json({ message: "Innings data is required." });
    }

    for (const inning of innings) {
      if (inning.battingStats) {
        for (const [name, stats] of Object.entries(inning.battingStats)) {
          const player = await Player.findOne({ name, team: inning.battingTeam });
          if (player) {
            player.batting.runs += stats.runs || 0;
            player.batting.balls += stats.balls || 0;
            player.batting.fours += stats.fours || 0;
            player.batting.sixes += stats.sixes || 0;
            if (stats.wagonWheel) {
              if (!player.batting.wagonWheel) player.batting.wagonWheel = new Map();
              for (const [region, runs] of Object.entries(stats.wagonWheel)) {
                const currentRuns = player.batting.wagonWheel.get(region) || 0;
                player.batting.wagonWheel.set(region, currentRuns + runs);
              }
            }
            await player.save();
          }
        }
      }
      if (inning.bowlingStats) {
        for (const [name, stats] of Object.entries(inning.bowlingStats)) {
          const player = await Player.findOne({ name, team: inning.bowlingTeam });
          if (player) {
            player.bowling.balls += stats.balls || 0;
            player.bowling.runs += stats.runs || 0;
            player.bowling.wickets += stats.wickets || 0;
            await player.save();
          }
        }
      }
    }
    res.status(200).json({ message: "Player stats committed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to commit player stats.", error: err.message });
  }
};