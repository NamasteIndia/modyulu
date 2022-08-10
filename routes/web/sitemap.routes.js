const express = require('express');
const router = express.Router();
const controller = require('../../controllers/sitemap.controller');

router.get("/techbigs.xml", controller.getMain);
router.get("/:type-sitemap.xml", controller.getDetail);
router.get("/:type-sitemap:page.xml", controller.getDetail);

module.exports = router;
