const express = require("express");
const router = express.Router();

const controller = require("../controllers/tournamentController");

router.post("/", controller.createTournament);
router.get("/", controller.getTournaments);
router.delete("/:id", controller.deleteTournament);
router.post("/generate", controller.generateMatches);
router.post("/advance", controller.advanceKnockout);
router.put("/result", controller.updateMatchResult);
router.put("/:id/qualify", controller.toggleQualify);
router.post("/:id/matches", controller.addMatchToTournament);

module.exports = router;
