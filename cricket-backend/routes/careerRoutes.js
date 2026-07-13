const express = require("express");
const router = express.Router();
const { recommendCareers, generateRoadmap } = require("../controllers/careerController");

router.post("/recommend", recommendCareers);
router.post("/roadmap", generateRoadmap);

module.exports = router;