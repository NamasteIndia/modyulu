const express = require("express");
var router = express.Router();
const controller = require("../../controllers/interactive.controller");
router.post("/rating", controller.AddRating);
router.post("/vote", controller.AddVote);
router.post("/ringtone", controller.Ringtone);
module.exports = router;