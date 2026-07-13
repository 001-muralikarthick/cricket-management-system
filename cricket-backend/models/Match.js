const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    teamA: String,
    teamB: String,

    runs: Number,
    wickets: Number,
    balls: Number,
    totalOvers: Number,
    innings: {
      type: Number,
      default: 1
    },
    firstInnings: {
      team: String,
      battingTeam: String,
      bowlingTeam: String,
      runs: Number,
      wickets: Number,
      balls: Number,
      extras: Object,
      battingStats: Object,
      bowlingStats: Object,
      history: Array
    },
    matchResult: String,
    matchStatsCommitted: {
      type: Boolean,
      default: false
    },
    needsSecondInningsSetup: {
      type: Boolean,
      default: false
    },

    striker: String,
    nonStriker: String,
    bowler: String,
    lastOverBowler: String,
    dismissedBatters: [String],
    needsBowlerChange: {
      type: Boolean,
      default: false
    },
    needsNewBatter: {
      type: Boolean,
      default: false
    },

    history: [
      {
        over: Number,
        ball: Number,
        runs: Number,
        batterRuns: Number,
        extras: Number,
        extraType: String,
        wicket: Boolean,
        wicketType: String,
        legal: Boolean,
        bowler: String,
        striker: String,
        shotRegion: String
      }
    ],

    extras: {
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
      byes: { type: Number, default: 0 },
      legByes: { type: Number, default: 0 }
    },

    battingStats: {
      type: Map,
      of: {
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
      default: {}
    },

    bowlingStats: {
      type: Map,
      of: {
        balls: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        wides: { type: Number, default: 0 },
        noBalls: { type: Number, default: 0 }
      },
      default: {}
    },

    status: {
      type: String,
      default: "LIVE"
    },
    tournament: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
