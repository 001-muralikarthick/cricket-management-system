const Team = require("../models/Team");

// CREATE TEAM
exports.createTeam = async (req, res) => {
  try {
    const team = await Team.create(req.body);
    res.json(team);
  } catch (err) {
    res.status(500).json(err);
  }
};

// GET ALL TEAMS
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(team);
  } catch (err) {
    res.status(500).json(err);
  }
};

// DELETE TEAM
exports.deleteTeam = async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
};