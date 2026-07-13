const express = require("express");
const router = express.Router();
const playerController = require("../controllers/playerController");

// The commit route must be before the /:id route to avoid being treated as a parameter
router.post("/commit-match-stats", playerController.commitMatchStats);

router.route("/")
  .get(playerController.getPlayers)
  .post(playerController.createPlayer);

router.route("/:id")
  .get(playerController.getPlayerById)
  .put(playerController.updatePlayer);

module.exports = router;