const Match = require("../models/Match");

// CREATE MATCH
exports.createMatch = async (req, res) => {
  try {
    const match = await Match.create(req.body);
    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL MATCHES
exports.getMatches = async (req, res) => {
  try {
    const matches = await Match.find();
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ONE MATCH
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE MATCH
exports.updateMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE MATCH
exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    res.json({ message: "Match deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};