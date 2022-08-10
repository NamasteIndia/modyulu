const express = require("express");
var router = express.Router();
const controller = require("../../controllers/apkmod.controller");

router.post("/add", controller.AddMod);
router.post("/edit", controller.EditMod);
router.post("/delete", controller.DeleteMod);
router.put("/numsort", controller.EditModNumSort);

module.exports = router;