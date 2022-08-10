var express = require("express"),
    router = express.Router(),
    controller = require("../../controllers/type.controller");
router.get("/", controller.showPage);
router.get("/add", controller.showPageAdd);
router.post("/add", controller.Add);
router.post("/edit/:id", controller.Edit);
router.get("/edit/:id", controller.showPageEdit);
router.post("/bulk", controller.Bulk);
router.put("/update/coltoggle/:id", controller.UpdateToggleColumn);
router.delete("/delete/:id", controller.Delete);
router.get("/datatable", controller.Datatable);
module.exports = router;