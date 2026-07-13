const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const mongoURI = process.env.MONGO_URI;

async function run() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to DB');

    const Team = mongoose.models.Team || mongoose.model('Team', new mongoose.Schema({ name: String, players: [String] }));
    const Player = mongoose.models.Player || mongoose.model('Player', new mongoose.Schema({ name: String, team: String }));

    // 1. Clean up Player collection duplicates for 'murali' / 'Murali'
    console.log('Deduplicating Player collection...');
    
    // Find all player records with name case-insensitive 'murali'
    const muralis = await Player.find({ name: /murali/i });
    console.log(`Found ${muralis.length} murali records`);
    
    if (muralis.length > 0) {
      // Keep the first one and delete the rest
      const keepId = muralis[0]._id;
      console.log(`Keeping record with ID: ${keepId}`);
      
      const deleteResult = await Player.deleteMany({
        name: /murali/i,
        _id: { $ne: keepId }
      });
      console.log(`Deleted ${deleteResult.deletedCount} duplicate Player records`);
      
      // Update the kept record to belong to "Local legends"
      await Player.findByIdAndUpdate(keepId, { team: 'Local legends', name: 'murali' });
      console.log('Updated kept record to name: murali, team: Local legends');
    }

    // 2. Double check teams' player arrays
    console.log('Cleaning up Team player arrays...');
    const teams = await Team.find({});
    for (const team of teams) {
      // Deduplicate names within the team itself
      const uniqueNames = [...new Set(team.players)];
      
      // Ensure 'murali' is only in 'Local legends' and not in other teams
      let filteredNames = uniqueNames;
      if (team.name.toLowerCase() !== 'local legends') {
        filteredNames = uniqueNames.filter(name => name.toLowerCase() !== 'murali');
      } else {
        // For Local legends, make sure 'murali' is present
        if (!filteredNames.some(name => name.toLowerCase() === 'murali')) {
          filteredNames.push('murali');
        }
      }
      
      if (team.players.length !== filteredNames.length || JSON.stringify(team.players) !== JSON.stringify(filteredNames)) {
        await Team.findByIdAndUpdate(team._id, { players: filteredNames });
        console.log(`Updated team ${team.name} players:`, filteredNames);
      }
    }

    console.log('Deduplication completed successfully!');

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

run();
