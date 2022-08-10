const express = require("express");
var router = express.Router();
const controller = require("../../controllers/comment.controller");

router.get("/", controller.showComment);
router.post("/reply", controller.ReplyCommentAdmin);
router.post("/bulk", controller.Bulk);
router.delete("/delete/:id", controller.Delete);
router.get("/datatable", controller.Datatable);
router.post("/edit", controller.UpdateComment);
router.put("/update/status", controller.UpdateCommentStatus);
router.get("/info/:id", controller.getCommentById);
router.get("/:postid/:status", controller.showComment);
module.exports = router;