const express = require("express");
var router = express.Router();
const controller = require("../../controllers/language.controller");

router.get("/", controller.ListLanguage);
router.post("/add", controller.AddLanguage);
router.post("/bulk", controller.Bulk);
router.post("/edit", controller.EditLanguage);
router.put("/update/coltoggle/:id", controller.UpdateToggleColumn);
router.get("/info/:id", controller.findOne);
router.delete("/delete/:id", controller.DeleteLanguage);
router.get("/datatable", controller.Datatable);

module.exports = router;