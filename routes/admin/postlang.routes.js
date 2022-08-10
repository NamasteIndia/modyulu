const { render } = require("ejs");
const express = require("express");
var router = express.Router();
const controller = require("../../controllers/postlang.controller");

router.get("/add/:postid/:langid", controller.GetAddPostLang);
router.get("/edit/:postid/:langid", controller.GetEditPostLang);
router.post("/add", controller.AddPostLang);
router.post("/edit", controller.EditPostLang);
router.delete("/delete/:postid/:langid", controller.DeletePostLang);

module.exports = router;