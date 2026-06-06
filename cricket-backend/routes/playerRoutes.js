const express = require("express");
const router = express.Router();
const Player = require("../models/Player");
const Team = require("../models/Team");

// GET ALL PLAYERS
router.get("/", async (req, res) => {
  const players = await Player.find();
  res.json(players);
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

module.exports = router;
