const express = require("express");
const router = express.Router();

const controller = require("../controllers/tournamentController");

router.post("/", controller.createTournament);
router.get("/", controller.getTournaments);
router.delete("/:id", controller.deleteTournament);
router.post("/generate", controller.generateMatches);
router.put("/result", controller.updateMatchResult);

module.exports = router;
