const jwt = require("jsonwebtoken");
const config = require("config");
const serverCf = config.get("server");
const { getAdminMenuOfRole } = require('../controllers/sitefeature.controller');
const errorController = require('../controllers/error.controller');
const db = require("../models");
const User = db.user;
const Role = db.role;
const AuthToken = db.auth;

exports.authAdminPage = async(req, res, next) =>{
    var sToken = req.session.token || "";
    if(sToken==""){
        return res.redirect("/login")
    }
    var role = req.session.role || null;
    if(role==null){
        return errorController.render403(req, res);
    }
    var adminMenu = await getAdminMenuOfRole(role);
    adminMenu = functions.createHierarchy(adminMenu);
    res.locals.adminMenu = adminMenu;
    next();
}

// Thực hiện chuyển trang cho những trang không được truy vấn khi chưa login
// change password, profile, your comment
exports.authFontendPage = (req, res, next) =>{
    if(!req.session.token){
        return res.redirect("/login")
    }
    next()
}

// Thực hiện chuyển trang cho những trang không được truy vấn khi đã login
// login, register, password recovery
exports.authRedirect = (req, res, next) =>{
    if(req.session.token){        
        if(req.session.role != null){
            // User quản trị thì chuyển về trang admin
            return res.redirect(`/${dashboard}`)
        }else{
            var home = (req.curLang.ismain) ? "/" : `/${req.curLang.id}`;
            // User thường thì chuyển về trang home
            return res.redirect(home)
        }
    }
    next()
}

// Xác thực thông tin người dùng bằng Header Token
exports.authHeader = async(req, res, next) =>{    
    var hToken = (req.headers['x-access-token']) ? req.headers['x-access-token'] : "";
    if(hToken !== ""){
        var aToken = await AuthToken.findOne({
            where:{
                token: hToken,
                isblock: false
            }
        })
        if(aToken == null){
            return errorController.render403Ajax(req, res);
        }else{
            aToken.hit = aToken.hit + 1;
            aToken.save();
        }
        jwt.verify(hToken, serverCf.secret, async(err, decoded) => {
            if (err) {
                // Xác thực không chính xác
                return errorController.render403Ajax(req, res);
            }
            // Lấy thông tin user từ TOKEN đã xác thực thành công
            var user = await User.findOne({
                where:{
                    id: decoded.id
                },
                include:{
                    model: Role,
                    as: "role",
                    attributes:['id', 'rolename', 'ismaster']
                }
            })
            if(user == null){
                // User không tồn tại
                return errorController.render403Ajax(req, res);
            }else{
                // Gán thông tin User vào thông tin đăng nhập site
                var fullname = `${user.lastname} ${user.firstname}`;
                req.session.token = hToken;
                req.session.userid = user.id;
                req.session.fullname = fullname;
                req.session.username = user.username;
                req.session.avatar = user.avatar;
                req.session.role = user.role;
                res.locals.cookies = req.cookies;
                res.locals.session = req.session;
            }
            next()
        })
    }else{
        next()
    }    
}

// Thực hiện nhận diện thông tin người dùng từ TOKEN lưu trong Cookie
exports.authCookie = async(req, res, next) =>{
    var cToken = req.cookies.token || "";
    var sToken = req.session.token || "";    
    // Tồn tại cookie Token, nhưng chưa verify User
    // Xãy ra khi user keep login quay trở lại site
    if(cToken!="" && sToken==""){
        var aToken = await AuthToken.findOne({
            where:{
                token: cToken,
                isblock: false
            }
        })
        if(aToken != null){
            aToken.hit = aToken.hit + 1;
            aToken.save();
            jwt.verify(cToken, serverCf.secret, async(err, decoded) => {
                if (err) {
                    // Hủy bỏ token khi gặp lỗi xác thực
                    res.cookie("token", "", { maxAge: 0, httpOnly: true });
                }
                // Lấy thông tin user từ TOKEN đã xác thực thành công
                var user = await User.findOne({
                    where:{
                        id: decoded.id
                    },
                    include:{
                        model: Role,
                        as: "role",
                        attributes:['id', 'rolename', 'ismaster']
                    }
                })
                // Gán thông tin User vào thông tin đăng nhập site
                if(user != null){
                    var fullname = `${user.lastname} ${user.firstname}`;
                    req.session.token = cToken;
                    req.session.userid = user.id;
                    req.session.fullname = fullname;
                    req.session.username = user.username;
                    req.session.avatar = user.avatar;
                    req.session.role = user.role;
                    res.locals.cookies = req.cookies;
                    res.locals.session = req.session;
                }
                next()
            })
        }else{
            next()
        }
    }else{        
        next()
    }
}