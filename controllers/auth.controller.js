const db = require("../models");
const config = require('config');
const serverConf = config.get("server");
const tracerConf = config.get("tracer");
const md5 = require("md5");
const Op = db.Sequelize.Op;
const User = db.user;
const AuthToken = db.auth;
const Role = db.role;
const Tracer = db.tracer;
const errorController = require("./error.controller");
const mailController = require("./mail.controller");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var expiresIn = 60 * 60 * 24 * 365;

exports.signup = async(req, res) => {
    var username = req.body.username || "",
        firstname = req.body.firstname || "",
        lastname = req.body.lastname || "",
        email = req.body.email || "",
        password = req.body.password || "";
    password = bcrypt.hashSync(password, 8);
    await User.create({
        username: username,
        email: email,
        firstname: firstname,
        lastname: lastname,
        password: password,
        isactive: false,
        roleid: null
    }).then(user => {
        var activecode = user.id + new Date().toUTCString();
        activecode = md5(activecode);
        user.activecode = activecode;
        user.save();
        var url = `/account?code=${activecode}`;
        url = (req.curLang.ismain) ? url : `/${req.curLang.id}${url}`;
        url = `${domain}${url}`;
        req.body.email = user.email;
        req.body.url = url;
        req.body.nickname = user.username;
        mailController.mailVerifyRegister(req, res);
        return res.send({ code: 1, message: res.__('frmRegisterMsgSuccess')});
    }).catch(() => {
        return errorController.render500Ajax(req, res);
    });
}

exports.signin = async(req, res) => {
    try{		
        //return res.json({ code: 0, message: "This fetures is blocked"});
        //var arrAllowUsers = ["kbep12a4","philcastillo", "feliciatyler", "EbonyLowe", "datnguyen", "KaceyMaggio", "LeoLogan", "orahart", "truyen", "itdemon"]
        //var username = req.body.username || "";
        //if(username!="philcastillo"){
            //return res.json({ code: 0, message: "This fetures is blocked"});
        //}		
        var minDate = new Date();
        minDate.setMinutes(minDate.getMinutes() - tracerConf.blockerrlogintime);
        var count = await Tracer.count({
            where:{
                //ip: req.ipAddr,
                object: "user",
                action: "login",
                createdAt: {
                    [Op.gte]: minDate
                }
            }
        })
        if(count >= tracerConf.maxerrloginnumber){
            return res.json({ code: 0, message: res.__('frmLoginMsgBlock') });
        }
        const user = await User.findOne({
            where: {
                username: req.body.username
            },
            include:{
                model: Role,
                as: "role",
                attributes:['id', 'rolename', 'ismaster']
            }
        })
        var flagTrace = false,
            errObject = {};
        if (!user) {        
            await Tracer.create({
                ip: req.ipAddr,
                agent: req.userAgent,
                object: "user",
                action: "login",
                notes: "Login faild"
            });
            return res.json({ code: 0, message: res.__('frmLoginMsgWrongUsername') });
        }

        if (user.isblock) {
            flagTrace = true;
            errObject = { code: 0, message: res.__('frmLoginMsgIsBlock') };
        }

        if (!user.isactive) {
            flagTrace = true;
            errObject = { code: 0, message: res.__('frmLoginMsgNotActive') };
        }

        var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );

        if (!passwordIsValid) {
            flagTrace = true;
            errObject = { code: 0, message: res.__('frmLoginMsgWrongPassword') };
        }

        if(flagTrace){
            await Tracer.create({
                ip: req.ipAddr,
                agent: req.userAgent,
                object: "user",
                action: "login",
                notes: "Login faild"
            });
            return res.json(errObject);
        }

        var token = jwt.sign({ id: user.id }, serverConf.secret, {
            expiresIn: expiresIn
        });
        await AuthToken.update({
            isblock: true
        },{
            where:{
                username: user.username
            }
        })
        await AuthToken.create({
            token: token,
            username: user.username
        })

        var fullname = user.lastname + " " + user.firstname;
        req.session.token = token;
        req.session.userid = user.id;
        req.session.fullname = fullname;
        req.session.username = user.username;
        req.session.avatar = user.avatar;
        req.session.role = user.role;
        if(req.body.keeplogin && req.body.keeplogin == "on"){
            res.cookie('token', token, { maxAge: expiresIn, httpOnly: true });
        }
        return res.json({ code: 1, message: "Login success", token: token });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}