const express = require("express");
var router = express.Router();
const controller = require("../../controllers/catelang.controller");

router.post("/add", controller.AddCateLang);
router.post("/edit", controller.EditCateLang);
router.post("/delete", controller.DeleteCateLang);

module.exports = router;

