const Player = require("../models/Player");

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