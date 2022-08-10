const express = require("express");
var router = express.Router();
const controller = require("../../controllers/comment.controller");
router.post("/add", controller.AddComment);
router.post("/ajax", controller.ajaxCommentPagination);
router.post("/like", controller.AddCommentLike);
router.post("/reply/ajax", controller.ajaxReplyPagination);
router.post("/profile/ajax", controller.ajaxProfileCommentPagination);
module.exports = router;