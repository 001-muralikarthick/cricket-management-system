const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  teamA: String,
  teamB: String,
  winner: { type: String, default: null },
  status: { type: String, default: "pending" }, // pending / completed
  runsA: { type: Number, default: 0 },
  runsB: { type: Number, default: 0 },
  matchRef: { type: String, default: null } // reference to the global Match document
});

const groupSchema = new mongoose.Schema({
  name: String,
  teams: [String],
  pointsTable: [
    {
      team: String,
      played: { type: Number, default: 0 },
      won: { type: Number, default: 0 },
      lost: { type: Number, default: 0 },
      points: { type: Number, default: 0 },
      qualified: { type: Boolean, default: false }
    }
  ]
});

const tournamentSchema = new mongoose.Schema({
  name: String,
  format: { type: String, default: "league" }, // league, knockout, league+knockout
  durationDays: { type: Number, default: 1 },
  minPointsToQualify: { type: Number, default: 0 },
  groups: [groupSchema],
  matches: [matchSchema],
  stage: { type: String, default: "group" } // group / semi / final
});

module.exports = mongoose.model("Tournament", tournamentSchema);