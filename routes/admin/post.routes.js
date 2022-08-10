const express = require("express");
var router = express.Router();
const controller = require("../../controllers/post.controller");

router.get("/icon", controller.Autoicon);

router.get("/post-apk", controller.ListPostApk);
router.get("/post-blog", controller.ListPostBlog);
router.get("/:posttype", controller.ListPost);
router.get("/:posttype/add", controller.GetAddPost);
router.post("/:posttype/add", controller.AddPost);
router.post("/:posttype/bulk", controller.BulkPost);
router.use("/:posttype/lang", require("./postlang.routes"));
router.get("/:posttype/edit/:id", controller.GetEditPost);
router.post("/:posttype/edit/:id", controller.EditPost);
router.get("/post-apk/datatable", controller.DatatableApk);
router.post("/post-apk/leech", controller.ApkLeech);
router.post("/post-apk/releech", controller.ApkReLeech);
router.use("/post-apk/mod", require('./apkmod.routes'));
router.use("/post-apk/modlink", require('./apklink.routes'));
router.use("/post-ringstone/file", require("./ringtone.routes"));
router.use("/post-apk/faq", require('./apkfaq.routes'));
router.use("/post-blog/faq", require('./apkfaq.routes'));
router.get("/post-blog/DatatableBlog", controller.ListPost);
router.get("/:posttype/datatable", controller.Datatable);
router.get("/:posttype/:catetype/add", controller.GetAddPost);
router.get("/:posttype/:catetype/datatable", controller.Datatable);
router.get("/:posttype/:catetype", controller.ListPost);

module.exports = router;