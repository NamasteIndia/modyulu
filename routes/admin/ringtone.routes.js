const express = require("express");
var router = express.Router();
const controller = require("../../controllers/ringtone.controller");

router.get("/:postid", controller.ListRingtones);
router.get("/info/:id", controller.findOne);
router.get("/:postid/datatable", controller.Datatable);
router.post("/edit", controller.EditRigntone);
router.post("/:postid/add", controller.addRigntones);
router.post("/bulk", controller.BulkRingtones);
router.delete("/delete/:id", controller.DeleteRingtone);
router.post("/:postid/upload", controller.UploadRingtone);


module.exports = router;