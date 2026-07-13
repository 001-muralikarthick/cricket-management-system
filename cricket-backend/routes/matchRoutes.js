const express = require("express");
const router = express.Router();

const {
  createMatch,
  getMatches,
  getMatchById,
  updateMatch,
  deleteMatch,
  generateScorecardPdf
} = require("../controllers/matchController");

// CREATE MATCH
router.post("/", createMatch);

// GET ALL MATCHES
router.get("/", getMatches);

// GET ONE MATCH
router.get("/:id", getMatchById);

// GENERATE PDF
router.get("/:id/pdf", generateScorecardPdf);

// UPDATE MATCH
router.put("/:id", updateMatch);

// DELETE MATCH
router.delete("/:id", deleteMatch);

module.exports = router;