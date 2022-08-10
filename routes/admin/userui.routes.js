const express = require("express");
var router = express.Router();
const controller = require("../../controllers/userui.controller");

router.post("/add", controller.Add);

router.get("/info/:screenid", controller.findOne);

router.delete("/Delete/:screenid", controller.Delete);

module.exports = router;