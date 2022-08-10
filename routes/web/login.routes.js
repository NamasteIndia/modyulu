const express = require("express");
var router = express.Router();
const { execPostPage } = require("../../controllers/web.controller")

router.use((req, res, next) => {
    if (req.session.token && req.session.username) {
        if(req.session.role != null){
            return res.redirect(dashboard);
        }
        return res.redirect("/");
    } else {
        next();
    }
});

router.get("/", async (req, res) => {
    return await execPostPage(req, res);
});

module.exports = router;