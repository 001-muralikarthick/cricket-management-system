const PDFDocument = require("pdfkit");
const Match = require("../models/Match");
const Tournament = require("../models/Tournament");

// Helper to format overs from balls
const formatOvers = (totalBalls) => {
    if (!totalBalls) return '0.0';
    return `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
};

// Helper to generate a table in the PDF
const generateTable = (doc, headers, data, colWidths) => {
    const startX = doc.x;
    const rowHeight = 20;
    const pageHeight = doc.page.height - doc.page.margins.bottom;

    const printHeaders = () => {
        doc.font('Helvetica-Bold');
        let currentX = startX;
        const currentY = doc.y; // Cache the Y position for the row
        headers.forEach((header, i) => {
            doc.text(header, currentX, currentY, { width: colWidths[i], lineBreak: false, ellipsis: true });
            currentX += colWidths[i];
        });
        doc.font('Helvetica');
        doc.y = currentY + rowHeight; // Advance Y manually once the row is done
    };

    printHeaders();

    data.forEach(row => {
        if (doc.y + rowHeight > pageHeight) {
            doc.addPage();
            printHeaders();
        }
        let currentX = startX;
        const currentY = doc.y; // Cache the Y position for the row
        row.forEach((cell, i) => {
            const cellText = cell !== undefined && cell !== null ? cell.toString() : '';
            doc.text(cellText, currentX, currentY, { width: colWidths[i], align: 'left', lineBreak: false, ellipsis: true });
            currentX += colWidths[i];
        });
        doc.y = currentY + rowHeight; // Advance Y manually once the row is done
    });

    // Reset X to the left margin so the next section isn't pushed to the right!
    doc.x = startX;
};

// CREATE MATCH
exports.createMatch = async (req, res) => {
  try {
    const match = await Match.create(req.body);

    if (req.body.tournament) {
      const tournament = await Tournament.findById(req.body.tournament);
      if (tournament) {
        // Find if a generated match already exists for these teams that is pending
        const existingMatch = tournament.matches.find(
          m => m.status === "pending" && !m.matchRef &&
            ((m.teamA === match.teamA && m.teamB === match.teamB) ||
             (m.teamA === match.teamB && m.teamB === match.teamA))
        );

        if (existingMatch) {
          existingMatch.matchRef = match._id.toString();
          await tournament.save();
        } else {
          // If not found, just push it
          tournament.matches.push({
            teamA: match.teamA,
            teamB: match.teamB,
            status: "pending",
            runsA: 0,
            runsB: 0,
            matchRef: match._id.toString()
          });
          await tournament.save();
        }
      }
    }

    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GENERATE PDF SCORECARD
exports.generateScorecardPdf = async (req, res) => {
    try {
        const matchDoc = await Match.findById(req.params.id);
        if (!matchDoc) {
            return res.status(404).json({ message: "Match not found" });
        }

        // Force Mongoose document (and internal Maps) into a plain JS object
        const match = JSON.parse(JSON.stringify(matchDoc));

        let tournament = null;
        if (match.tournament) {
            tournament = await Tournament.findById(match.tournament).lean();
        }

        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=scorecard-${match.teamA}-vs-${match.teamB}.pdf`);
        // Add headers to prevent caching by the browser
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        doc.pipe(res);

        // --- Document Content ---

        // Header
        if (tournament) {
            doc.fontSize(12).font('Helvetica-Oblique').text(tournament.name, { align: 'center' });
            doc.moveDown(0.5);
        }
        doc.fontSize(18).font('Helvetica-Bold').text('Official Scorecard', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica').text(`${match.teamA} vs ${match.teamB}`, { align: 'center' });
        if (match.matchResult) {
            doc.fontSize(11).font('Helvetica-Oblique').text(match.matchResult, { align: 'center' });
        }
        doc.moveDown(2);

        const generateInningsCard = (inningsData, inningsNum) => {
            if (!inningsData) return;

            doc.fontSize(14).font('Helvetica-Bold').text(`Innings ${inningsNum}: ${inningsData.battingTeam || inningsData.team}`, { underline: true });
            doc.fontSize(12).font('Helvetica').text(`Score: ${inningsData.runs}/${inningsData.wickets} (${formatOvers(inningsData.balls)} Overs)`);
            doc.moveDown();

            // Batting Table
            doc.fontSize(11).font('Helvetica-Bold').text('Batting');
            doc.moveDown(0.5);
            const battingHeaders = ['Batter', 'Runs', 'Balls', '4s', '6s', 'SR'];
            const battingColWidths = [160, 50, 50, 50, 50, 60];
            const battingData = Object.entries(inningsData.battingStats || {}).map(([player, stats]) => {
                const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
                return [player, stats.runs || 0, stats.balls || 0, stats.fours || 0, stats.sixes || 0, sr];
            });
            generateTable(doc, battingHeaders, battingData, battingColWidths);

            // Extras
            const extras = inningsData.extras || {};
            const totalExtras = (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0);
            if (totalExtras > 0) {
                doc.moveDown(0.5);
                doc.fontSize(10).text(
                    `Extras: ${totalExtras} (w ${extras.wides || 0}, nb ${extras.noBalls || 0}, b ${extras.byes || 0}, lb ${extras.legByes || 0})`
                );
            }

            doc.moveDown(2);

            // Bowling Table
            doc.fontSize(11).font('Helvetica-Bold').text('Bowling');
            doc.moveDown(0.5);
            const bowlingHeaders = ['Bowler', 'Overs', 'Runs', 'Wickets', 'Econ'];
            const bowlingColWidths = [180, 60, 60, 60, 70];
            const bowlingData = Object.entries(inningsData.bowlingStats || {}).map(([player, stats]) => {
                const overs = formatOvers(stats.balls || 0);
                const econ = stats.balls > 0 ? (stats.runs / (stats.balls / 6)).toFixed(2) : "0.00";
                return [player, overs, stats.runs || 0, stats.wickets || 0, econ];
            });
            generateTable(doc, bowlingHeaders, bowlingData, bowlingColWidths);
        };

        const inningsList = [];

        // Gather Innings 1 data
        if (match.firstInnings) {
            inningsList.push({ ...match.firstInnings, number: 1 });
        } else if (match.innings === 1 && match.matchResult) {
            // This is a completed 1-inning match where `firstInnings` object was not stored.
            inningsList.push({
                number: 1,
                team: match.teamA, battingTeam: match.teamA, bowlingTeam: match.teamB,
                runs: match.runs, wickets: match.wickets, balls: match.balls,
                battingStats: match.battingStats, bowlingStats: match.bowlingStats,
                extras: match.extras,
            });
        }

        // Gather Innings 2 data
        if (match.innings === 2 && match.matchResult) {
            inningsList.push({
                number: 2,
                team: match.teamB, battingTeam: match.teamB, bowlingTeam: match.teamA,
                runs: match.runs, wickets: match.wickets, balls: match.balls,
                battingStats: match.battingStats, bowlingStats: match.bowlingStats,
                extras: match.extras,
            });
        }

        // Generate PDF for each innings
        inningsList.forEach((inningsData, index) => {
            if (index > 0) {
                // If there's not enough space for another innings card, start a new page.
                // An innings card needs at least ~250pts (header + 2 tables with a few rows)
                if (doc.y > doc.page.height - doc.page.margins.bottom - 250) {
                    doc.addPage();
                } else {
                    doc.moveDown(3);
                }
            }
            generateInningsCard(inningsData, inningsData.number);
        });

        doc.end();

    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).json({ message: 'Failed to generate PDF scorecard.' });
    }
};

// GET ALL MATCHES
exports.getMatches = async (req, res) => {
  try {
    const matches = await Match.find();
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ONE MATCH
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE MATCH
exports.updateMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Automatically update tournament if match is completed
    if (match.matchResult && match.tournament) {
      const tournament = await Tournament.findById(match.tournament);
      if (tournament) {
        let tMatch = tournament.matches.find(m => m.matchRef === match._id.toString());
        // Fallback for matches created before matchRef was added
        if (!tMatch) {
          tMatch = tournament.matches.find(
            m => m.status === "pending" &&
              ((m.teamA === match.teamA && m.teamB === match.teamB) ||
               (m.teamA === match.teamB && m.teamB === match.teamA))
          );
        }

        if (tMatch && tMatch.status !== "completed") {
          let winnerTeam = null;
          let isTie = match.matchResult.toLowerCase().includes("tie");

          if (!isTie) {
            if (match.matchResult.includes(match.teamA)) winnerTeam = match.teamA;
            else if (match.matchResult.includes(match.teamB)) winnerTeam = match.teamB;
          }

          if (winnerTeam || isTie) {
             tMatch.winner = isTie ? "Tie" : winnerTeam;
             tMatch.status = "completed";
             tMatch.runsA = match.teamA === match.firstInnings?.team ? match.firstInnings.runs : match.runs;
             tMatch.runsB = match.teamB === match.firstInnings?.team ? match.firstInnings.runs : match.runs;

             // Update Points Table
             tournament.groups.forEach(group => {
               group.pointsTable.forEach(team => {
                 if (team.team === tMatch.teamA || team.team === tMatch.teamB) {
                   team.played += 1;
                   if (isTie) {
                     team.points += 1; // 1 point for a tie
                   } else if (team.team === winnerTeam) {
                     team.won += 1;
                     team.points += 2; // 2 points for a win
                   } else {
                     team.lost += 1;
                   }

                   // Auto-qualify logic
                   if (tournament.minPointsToQualify > 0 && team.points >= tournament.minPointsToQualify) {
                     team.qualified = true;
                   }
                 }
               });
             });
             
             tournament.markModified("groups");
             await tournament.save();
          }
        }
      }
    }

    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE MATCH
exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    res.json({ message: "Match deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};