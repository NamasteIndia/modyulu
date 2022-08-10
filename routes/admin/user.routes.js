const express = require("express");
var router = express.Router();
const { authJwt } = require("../../middleware");
const controller = require("../../controllers/user.controller");

router.get("/", controller.ListUser);
router.post("/add", controller.AddUser);
router.post("/bulk", controller.Bulk);
router.post("/edit", controller.EditUser);
router.put("/update/coltoggle/:id", controller.UpdateToggleColumn);
router.get("/info/:id", controller.findOne);
router.delete("/delete/:id", controller.DeleteUser);
router.get("/datatable", controller.Datatable);

module.exports = router;