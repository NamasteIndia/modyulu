const express = require("express");
var router = express.Router();
const controller = require("../../controllers/sitefeature.controller");

router.get("/", controller.showPage);

router.post("/add", controller.Add);

router.post("/bulk", controller.Bulk);

router.post("/edit", controller.Edit);

router.put("/update/coltoggle/:id", controller.UpdateToggleColumn);

router.get("/info/:id", controller.findOne);

router.delete("/delete/:id", controller.Delete);

router.get("/datatable", controller.Datatable);

module.exports = router;