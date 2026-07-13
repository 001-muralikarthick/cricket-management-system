const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: String,
    players: [String],
    captain: String,
    viceCaptain: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);