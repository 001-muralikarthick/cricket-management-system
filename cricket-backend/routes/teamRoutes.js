const express = require("express");
const router = express.Router();

// ✅ IMPORT ALL CONTROLLERS HERE
const {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam
} = require("../controllers/teamController");

// CREATE TEAM
router.post("/", createTeam);

// GET TEAMS
router.get("/", getTeams);

// UPDATE TEAM (FIXED ERROR)
router.put("/:id", updateTeam);

// DELETE TEAM
router.delete("/:id", deleteTeam);

module.exports = router;