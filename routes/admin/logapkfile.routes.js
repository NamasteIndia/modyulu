const express = require("express");
var router = express.Router();
const controller = require("../../controllers/logapkfile.controller");

router.put("/offnotice/:id", controller.offAutoUpdateErrorNotice);

module.exports = router;