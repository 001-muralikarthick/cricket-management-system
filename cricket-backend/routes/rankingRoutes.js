const express = require("express");
const router = express.Router();

const controller = require("../controllers/rankingController");

router.get("/orange-cap", controller.getOrangeCap);
router.get("/purple-cap", controller.getPurpleCap);

module.exports = router;