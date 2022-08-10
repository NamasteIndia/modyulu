const db = require("../models");
const User = db.user;

checkDuplicateUsernameOrEmail = (req, res, next) => {
    // Username
    User.findOne({
        where: {
            username: req.body.username
        }
    }).then(user => {
        if (user) {
            return res.json({ code:0, message: res.__('frmSingUpMsgWrongUsername')});
        }
        // Email
        User.findOne({
            where: {
                email: req.body.email
            }
        }).then(user => {
            if (user) {
                return res.json({ code: 0, message: res.__('frmSingUpMsgWrongEmail')});
            }
            next();
        });
    });
}

checkValidSendCode = (req, res, next) => {   
    var error = [];
    var email = req.body.email || "";
    email = validEmail(email, res);
    if(email.length > 0){
        error.push({
            id: "email",
            msg: email
        })
    }
    if(error.length > 0){
        return res.json({code: 0, message: "", data: error});
    }
    next()
}

checkValidRecoveryPassword = (req, res, next) => {    
    var error = [];    
    var email = req.body.email || "";
    email = validEmail(email, res);
    if(email.length > 0){
        error.push({
            id: "email",
            msg: email
        })
    }
    var password = req.body.password || "";
    password = validPassword(password, res);
    if(password.length > 0){
        error.push({
            id: "password",
            msg: password
        })
    }
    var cpassword = req.body.confirmpassword || "";
    cpassword = validConfirmPassword(req.body.password, cpassword, res);
    if(cpassword.length > 0){
        error.push({
            id: "confirmpassword",
            msg: cpassword
        })
    }
    var captcha = req.body.captcha || "";
    captcha = validCaptcha(captcha, res);
    if(captcha.length > 0){
        error.push({
            id: "captcha",
            msg: captcha
        })
    }
    if(error.length > 0){
        return res.json({code: 0, message: "", data: error});
    }
    next()   
}

checkValidChangePass = (req, res, next) => {    
    var error = [];
    var password = req.body.password || "";
    password = validPassword(password, res);
    if(password.length > 0){
        error.push({
            id: "password",
            msg: password
        })
    }
    var npassword = req.body.npassword || "";
    npassword = validPassword(npassword, res);
    if(npassword.length > 0){
        error.push({
            id: "npassword",
            msg: npassword
        })
    }
    var cpassword = req.body.cpassword || "";
    cpassword = validConfirmPassword(req.body.npassword, cpassword, res);
    if(cpassword.length > 0){
        error.push({
            id: "cpassword",
            msg: cpassword
        })
    }    
    if(error.length > 0){
        return res.json({code: 0, message: "", data: error});
    }
    next()   
}

checkValidSignUp = (req, res, next) => {    
    var error = [];
    var username = req.body.username || "";
    username = validUsername(username, res);   
    if(username.length > 0){
        error.push({
            id: "username",
            msg: username
        })
    }
    var email = req.body.email || "";
    email = validEmail(email, res);
    if(email.length > 0){
        error.push({
            id: "email",
            msg: email
        })
    }
    var password = req.body.password || "";
    password = validPassword(password, res);
    if(password.length > 0){
        error.push({
            id: "password",
            msg: password
        })
    }
    var cpassword = req.body.confirmpassword || "";
    cpassword = validConfirmPassword(req.body.password, cpassword, res);
    if(cpassword.length > 0){
        error.push({
            id: "confirmpassword",
            msg: cpassword
        })
    }    
    if(error.length > 0){
        return res.json({code: 0, message: "", data: error});
    }
    next()   
}

function validEmail(str, res){
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(!re.test(String(str).toLowerCase())){
        return res.__('validWrongMsgEmail');
    }
    return "";
}

function validUsername(str, res){
    const re = /^[a-z]{1}[a-z0-9]{4,19}\S$/;
    if(!re.test(String(str).toLowerCase())){
        return res.__('validWrongMsgUsername');
    }
    return "";
}

function validPassword(str, res){
    const re = /^.{8,45}\S$/;
    if(!re.test(String(str).toLowerCase())){
        return res.__('validWrongMsgPassword');
    }
    return "";
}

function validConfirmPassword(pass, cpass, res){    
    if(pass !== cpass){
        return res.__('validWrongMsgConfirmPassword');
    }
    return "";
}

function validCaptcha(captcha, res){
    const re = /^\d{6,}$/;
    if(!re.test(String(captcha).toLowerCase())){
        return res.__('frmRecoveryWrongCapcha');
    }
    return "";
}

const verifySignUp = {
    checkDuplicateUsernameOrEmail: checkDuplicateUsernameOrEmail,
    checkValidSignUp: checkValidSignUp,
    checkValidSendCode: checkValidSendCode,
    checkValidRecoveryPassword: checkValidRecoveryPassword,
    checkValidChangePass: checkValidChangePass
};

module.exports = verifySignUp;