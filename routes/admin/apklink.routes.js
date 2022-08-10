const express = require("express");
var router = express.Router();
const controller = require("../../controllers/apklink.controller");

router.post("/add", controller.AddModlink);
router.post("/edit", controller.EditModlink);
router.post("/delete", controller.DeleteModlink);
router.put("/numsort", controller.EditModLinkNumSort);

module.exports = router;