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

        // Auto-qualify logic
        if (tournament.minPointsToQualify > 0 && team.points >= tournament.minPointsToQualify) {
          team.qualified = true;
        }
      });
    });

    tournament.markModified("groups");
    await tournament.save();

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GENERATE MATCHES =================
exports.generateMatches = async (req, res) => {
  try {
    const { tournamentId } = req.body;

    const tournament = await Tournament.findById(tournamentId);

    let matches = [];

    if (tournament.format === "league" || tournament.format === "league+knockout") {
      // Round Robin for groups
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
    } else if (tournament.format === "knockout") {
      // Knockout format
      // Just pair up all teams in the first group
      const teams = tournament.groups[0] ? tournament.groups[0].teams : [];
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          matches.push({
            teamA: teams[i],
            teamB: teams[i + 1]
          });
        } else {
          // Bye
          matches.push({
            teamA: teams[i],
            teamB: "BYE",
            winner: teams[i],
            status: "completed"
          });
        }
      }
    }

    tournament.matches = matches;
    await tournament.save();

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ADVANCE KNOCKOUT =================
exports.advanceKnockout = async (req, res) => {
  try {
    const { tournamentId } = req.body;
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    let advancingTeams = [];

    if (tournament.format === "league+knockout" && tournament.stage === "group") {
      let allTeams = [];
      tournament.groups.forEach(g => {
        allTeams.push(...g.pointsTable);
      });
      
      const manuallyQualified = allTeams.filter(t => t.qualified);
      if (manuallyQualified.length > 0) {
        advancingTeams = manuallyQualified.map(t => t.team);
      } else {
        allTeams.sort((a, b) => b.points - a.points || b.won - a.won);
        advancingTeams = allTeams.slice(0, 4).map(t => t.team);
      }
      tournament.stage = "semi";
    } else {
      // Find all completed matches
      const completed = tournament.matches.filter(m => m.status === "completed" && m.winner);
      
      // A winner is "terminal" if they haven't been scheduled in any subsequent match
      const scheduledTeams = new Set();
      tournament.matches.forEach(m => {
        if (m.teamA !== "BYE") scheduledTeams.add(m.teamA);
        if (m.teamB !== "BYE") scheduledTeams.add(m.teamB);
      });

      // Actually, wait, scheduledTeams will contain everyone who played. 
      // Better way: Find matches where the winner does not appear as teamA or teamB in any match that comes AFTER it in the array.
      let terminalWinners = [];
      for (let i = 0; i < completed.length; i++) {
        const m = completed[i];
        const winner = m.winner;
        let playedAgain = false;
        // Check if winner played in any match generated AFTER this one
        for (let j = tournament.matches.length - 1; j >= 0; j--) {
          const subsequentMatch = tournament.matches[j];
          if (subsequentMatch._id.toString() === m._id.toString()) break; // reached itself
          if (subsequentMatch.teamA === winner || subsequentMatch.teamB === winner) {
            playedAgain = true;
            break;
          }
        }
        if (!playedAgain && winner !== "BYE") {
          terminalWinners.push(winner);
        }
      }

      if (terminalWinners.length < 2) {
        return res.status(400).json({ message: "Not enough completed match winners to advance, or tournament is over." });
      }

      advancingTeams = terminalWinners;
      tournament.stage = advancingTeams.length <= 2 ? "final" : "knockout";
    }

    if (advancingTeams.length > 0) {
      let nextMatches = [];
      for (let i = 0; i < advancingTeams.length; i += 2) {
        if (i + 1 < advancingTeams.length) {
          nextMatches.push({ teamA: advancingTeams[i], teamB: advancingTeams[i + 1] });
        } else {
          nextMatches.push({ teamA: advancingTeams[i], teamB: "BYE", winner: advancingTeams[i], status: "completed" });
        }
      }
      tournament.matches.push(...nextMatches);
      await tournament.save();
    }

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= TOGGLE QUALIFY =================
exports.toggleQualify = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamName, qualified } = req.body;

    const tournament = await Tournament.findById(id);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    tournament.groups.forEach(group => {
      group.pointsTable.forEach(team => {
        if (team.team === teamName) {
          team.qualified = qualified;
        }
      });
    });

    await tournament.save();
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ADD MATCH TO TOURNAMENT =================
exports.addMatchToTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamA, teamB } = req.body;

    const tournament = await Tournament.findById(id);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    tournament.matches.push({
      teamA,
      teamB,
      status: "pending",
      runsA: 0,
      runsB: 0
    });

    await tournament.save();
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};