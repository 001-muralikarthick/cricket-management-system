const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: String,
  team: String,

  batting: {
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 }
  },

  bowling: {
    overs: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model("Player", playerSchema);