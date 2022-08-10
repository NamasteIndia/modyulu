const express = require("express");
var router = express.Router();
const { verifySignUp } = require("../../middleware");
const controller = require("../../controllers/auth.controller.js");

router.post("/signup", [
        verifySignUp.checkValidSignUp,
        verifySignUp.checkDuplicateUsernameOrEmail        
    ],
    controller.signup
);

router.post("/signin", controller.signin);

module.exports = router;