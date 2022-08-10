const express = require("express");
var router = express.Router();
const controller = require("../../controllers/faq.controller");

router.post("/add", controller.AddFaq);
router.post("/edit", controller.EditFaq);
router.post("/delete", controller.DeleteFaq);
router.put("/numsort", controller.EditFaqNumSort);

module.exports = router;