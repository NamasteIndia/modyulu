const express = require("express");
var router = express.Router();
const controller = require("../../controllers/rolefeature.controller");

router.get("/", controller.showPage);
router.post("/add", controller.ajaxAddRoleFeature);
router.post("/edit", controller.ajaxChangePermissionRoleFeature);
router.delete("/delete/:rfid", controller.ajaxRemoveRoleFeature);
router.post("/clear/:rid", controller.ajaxClearRoleFeature);
router.get("/:rid", controller.showPage);

module.exports = router;