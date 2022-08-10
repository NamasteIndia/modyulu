const express = require("express");
var router = express.Router();
const controller = require("../../controllers/apkchoice.controller");

router.get("/", controller.ListApkChoices);
router.get("/sl2", controller.AjaxPosts);
router.post("/save", controller.Save);

module.exports = router;