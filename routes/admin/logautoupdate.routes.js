const express = require("express");
var router = express.Router();
const controller = require("../../controllers/logupdateversion.controller");

router.get("/", controller.showList);
router.get("/datatable", controller.Datatable);

module.exports = router;