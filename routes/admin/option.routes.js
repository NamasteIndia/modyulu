const express = require("express");
var router = express.Router();
const controller = require("../../controllers/option.controller");

router.get("/", controller.showPage);
router.post("/add", controller.AddOption);
router.post("/update", controller.UpdateOption);

module.exports = router;