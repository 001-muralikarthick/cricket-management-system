const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/cricket_db';

const MatchSchema = new mongoose.Schema(
  {
    teamA: String,
    teamB: String,
    runs: Number,
    wickets: Number,
    balls: Number,
    totalOvers: Number,
    innings: { type: Number, default: 1 },
    matchResult: String,
    status: { type: String, default: "LIVE" }
  },
  { timestamps: true }
);

const Match = mongoose.models.Match || mongoose.model("Match", MatchSchema);

async function seed() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Seeding matches database...');

    // Clear existing matches to avoid duplication (if desired, or we can just append)
    await Match.deleteMany({});
    console.log('Cleared existing matches');

    // Past Match 1: FCR IPL Jega Heater vs TEAM VETRI KONDAN
    // Jega Heater 55/9 (10.0) vs TEAM VETRI KONDAN 56/5 (6.1)
    // TEAM VETRI KONDAN won by 5 wickets
    const past1 = await Match.create({
      teamA: 'Jega Heater',
      teamB: 'TEAM VETRI KONDAN',
      runs: 56,
      wickets: 5,
      balls: 37,
      totalOvers: 10,
      innings: 2,
      firstInnings: {
        team: 'Jega Heater',
        runs: 55,
        wickets: 9,
        balls: 60
      },
      matchResult: 'TEAM VETRI KONDAN won by 5 wickets',
      winner: 'TEAM VETRI KONDAN',
      status: 'completed'
    });

    // Past Match 2: FCR IPL TEAM VETRI KONDAN vs Local Legends
    // TEAM VETRI KONDAN 87/7 (10.0) vs Local Legends 91/6 (8.5)
    // Local Legends won by 4 wickets
    const past2 = await Match.create({
      teamA: 'TEAM VETRI KONDAN',
      teamB: 'Local Legends',
      runs: 91,
      wickets: 6,
      balls: 53,
      totalOvers: 10,
      innings: 2,
      firstInnings: {
        team: 'TEAM VETRI KONDAN',
        runs: 87,
        wickets: 7,
        balls: 60
      },
      matchResult: 'Local Legends won by 4 wickets',
      winner: 'Local Legends',
      status: 'completed'
    });

    // Upcoming Match 1: FCR IPL
    // TEAM VETRI KONDAN vs Local Legends
    const upcoming1 = await Match.create({
      teamA: 'TEAM VETRI KONDAN',
      teamB: 'Local Legends',
      runs: 0,
      wickets: 0,
      balls: 0,
      totalOvers: 10,
      status: 'upcoming'
    });

    // Upcoming Match 2: SPL by Agni boys
    // Cross CC vs Elite Eagles Cricket Club
    const upcoming2 = await Match.create({
      teamA: 'Cross CC',
      teamB: 'Elite Eagles Cricket Club',
      runs: 0,
      wickets: 0,
      balls: 0,
      totalOvers: 25,
      status: 'upcoming'
    });

    console.log('Successfully seeded matches:');
    console.log('- Past 1 ID:', past1._id);
    console.log('- Past 2 ID:', past2._id);
    console.log('- Upcoming 1 ID:', upcoming1._id);
    console.log('- Upcoming 2 ID:', upcoming2._id);

  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
