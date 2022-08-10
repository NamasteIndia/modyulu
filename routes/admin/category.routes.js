const express = require("express");
var router = express.Router();
const controller = require("../../controllers/category.controller");

router.get("/:catetype", controller.ListCategory);
router.get("/:catetype/edit/:id", controller.GetEditCategory);
router.post("/:catetype/add", controller.AddCategory);
router.post("/:catetype/edit", controller.EditCategory);
router.get("/:catetype/info", controller.findOne);
router.delete("/:catetype/delete/:id", controller.DeleteCategory);
router.post("/:catetype/bulk", controller.BulkCategory);
router.get("/:catetype/datatable", controller.Datatable);
router.get("/:catetype/select2", controller.select2Ajax);
router.use("/:catetype/lang", require("./catelang.routes"));

module.exports = router;