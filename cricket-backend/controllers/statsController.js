const Player = require("../models/Player");

async function updateBattingStats(strikerName, runs, shotRegion) {
  const player = await Player.findOne({ name: strikerName });
  if (!player) return;

  player.batting.runs += runs;
  player.batting.balls += 1;

  if (runs === 4) player.batting.fours += 1;
  if (runs === 6) player.batting.sixes += 1;

  // Record runs to the specific shot region if provided
  if (shotRegion && runs > 0) {
    if (!player.batting.wagonWheel) player.batting.wagonWheel = new Map();
    const currentRegionRuns = player.batting.wagonWheel.get(shotRegion) || 0;
    player.batting.wagonWheel.set(shotRegion, currentRegionRuns + runs);
  }

  await player.save();
}

async function updateBowlingStats(bowlerName, runs, isWicket) {
  const player = await Player.findOne({ name: bowlerName });
  if (!player) return;

  player.bowling.runs += runs;

  if (isWicket) {
    player.bowling.wickets += 1;
  }

  await player.save();
}

module.exports = {
  updateBattingStats,
  updateBowlingStats
};