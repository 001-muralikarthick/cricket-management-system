const Tournament = require("../models/Tournament");

// ================= CREATE TOURNAMENT =================
exports.createTournament = async (req, res) => {
  try {
    const tournament = await Tournament.create(req.body);
    res.status(201).json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= DELETE TOURNAMENT =================
exports.deleteTournament = async (req, res) => {
  try {
    await Tournament.findByIdAndDelete(req.params.id);
    res.json({ message: "Tournament deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getTournaments = async (req, res) => {
  try {
    const data = await Tournament.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE MATCH RESULT =================
exports.updateMatchResult = async (req, res) => {
  try {
    const { tournamentId, matchId, winner, runsA, runsB } = req.body;

    const tournament = await Tournament.findById(tournamentId);

    const match = tournament.matches.id(matchId);

    match.winner = winner;
    match.status = "completed";
    match.runsA = runsA;
    match.runsB = runsB;

    // ================= POINTS UPDATE =================
    tournament.groups.forEach(group => {
      group.pointsTable.forEach(team => {
        if (team.team === winner) {
          team.won += 1;
          team.points += 2;
        }

        if (team.team === match.teamA || team.team === match.teamB) {
          team.played += 1;
        }

        if (team.team !== winner &&
           (team.team === match.teamA || team.team === match.teamB)) {
          team.lost += 1;
        }
      });
    });

    await tournament.save();

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GENERATE MATCHES (ROUND ROBIN) =================
exports.generateMatches = async (req, res) => {
  try {
    const { tournamentId } = req.body;

    const tournament = await Tournament.findById(tournamentId);

    let matches = [];

    tournament.groups.forEach(group => {
      for (let i = 0; i < group.teams.length; i++) {
        for (let j = i + 1; j < group.teams.length; j++) {
          matches.push({
            teamA: group.teams[i],
            teamB: group.teams[j]
          });
        }
      }
    });

    tournament.matches = matches;

    await tournament.save();

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};