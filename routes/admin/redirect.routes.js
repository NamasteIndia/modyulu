const express = require("express");
var router = express.Router();
const controller = require("../../controllers/redirect.controller");

router.get("/", controller.ListRedirect);
router.post("/bulk", controller.Bulk);
router.post("/add", controller.AddRedirect);
router.post("/edit", controller.EditRedirect);
router.put("/update/coltoggle/:id", controller.UpdateToggleColumn);
router.get("/info/:id", controller.findOne);
router.delete("/delete/:id", controller.DeleteRedirect);
router.get("/datatable", controller.Datatable);

module.exports = router;