const express = require("express");
var router = express.Router();
const accountController = require("../../controllers/account.controller");
const { authFontendPage } = require("../../middleware/authJwt");
const { verifySignUp } = require("../../middleware");
const { UploadAvatar } = require("../../controllers/media.controller");

router.get("/", accountController.verifyAccount);
router.get("/profile", authFontendPage, accountController.showProfile);
router.post("/profile", authFontendPage, accountController.doProfile);
router.post("/sendcode", verifySignUp.checkValidSendCode, accountController.sendCodeRecovery);
router.get("/nonecache", accountController.getNoneCacheUserInfo);
router.get("/password-recovery", accountController.showPassRecovery);
router.post("/password-recovery", verifySignUp.checkValidRecoveryPassword, accountController.doPassRecovery);
router.get("/comment", authFontendPage, accountController.showDiscuss);
router.get("/password", authFontendPage, accountController.showChangePassword);
router.post("/password", authFontendPage, verifySignUp.checkValidChangePass, accountController.doChangePassword);
router.post("/avatar", authFontendPage, UploadAvatar);

module.exports = router;