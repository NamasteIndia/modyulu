const express = require("express");
var router = express.Router();
const controller = require("../../controllers/ads.controller");

router.get("/", controller.ListAds);
router.post("/add", controller.AddAds);
router.post("/bulk", controller.Bulk);
router.post("/edit", controller.EditAds);
router.put("/update/coltoggle/:id", controller.UpdateToggleColumn);
router.get("/info/:id", controller.findOne);
router.delete("/delete/:id", controller.DeleteAds);
router.get("/datatable", controller.Datatable);

module.exports = router;