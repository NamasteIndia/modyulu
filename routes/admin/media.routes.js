const express = require("express");
var router = express.Router();
const controller = require("../../controllers/media.controller");

router.get("/", controller.ListMedia);
router.post("/bulk", controller.Bulk);
router.post("/edit", controller.EditMedia);
router.get("/info/:id", controller.findOne);
router.delete("/delete/:id", controller.DeleteMedia);
router.get("/datatable", controller.Datatable);
router.get("/list", controller.ListMediaModal);
router.get("/initmodal", controller.ListMediaModalInit);
router.get("/add", controller.NewMedia);
router.post("/single", controller.UploadSingle);
router.post("/download", controller.UploadFormUrl);

module.exports = router;