const express = require("express");
var router = express.Router();
const controller = require("../../controllers/menu.controller");

router.get("/", controller.showMenu);
router.get("/:id", controller.showMenu);
router.post("/add", controller.addMenu);
router.put("/edit", controller.editMenu);
router.delete("/delete/:id", controller.delMenu);
router.get("/select2/category", controller.menuAjaxCategories);
router.get("/select2/post", controller.menuAjaxPosts);
router.post("/add/template", controller.getMenuItemTemplate);

module.exports = router;