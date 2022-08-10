const express = require("express");
var router = express.Router();
const controller = require("../../controllers/feedback.controller");
router.post("/add", controller.Add);
router.post("/send", controller.AddWithImage);
module.exports = router;