const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: String,
  team: String,
  role: { type: String, enum: ['Batter', 'Bowler', 'All-rounder', 'Wicket-keeper', ''], default: '' },
  bowlerType: { type: String, enum: ['Fast', 'Spin', 'None', ''], default: '' },

  batting: {
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    wagonWheel: {
      type: Map,
      of: Number,
      default: {}
    }
  },

  bowling: {
    balls: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model("Player", playerSchema);