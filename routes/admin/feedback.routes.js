var express = require("express"),
    router = express.Router(),
    controller = require("../../controllers/feedback.controller");
router.get("/", controller.showPage);
router.post("/bulk", controller.Bulk);
router.put("/update/coltoggle/:id", controller.UpdateToggleColumn);
router.delete("/delete/:id", controller.Delete);
router.get("/datatable", controller.Datatable);
module.exports = router;