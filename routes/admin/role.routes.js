const express = require("express");
var router = express.Router();
const controller = require("../../controllers/role.controller");

router.get("/", controller.ListRole);

router.post("/add", controller.AddRole);

router.post("/bulk", controller.Bulk);

router.post("/edit", controller.EditRole);

router.get("/info/:id", controller.findOne);

router.delete("/delete/:id", controller.DeleteRole);

router.get("/datatable", controller.Datatable);

module.exports = router;