const db = require("../models");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const User = db.user;
const Role = db.role;
const errorController = require("./error.controller");
var bcrypt = require("bcryptjs");

// Hien thi trang User
exports.ListUser = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        var roles = await Role.findAll();
        res.render("admin/user", { roles });
    }catch(err){
        return errorController.render500(req, res);
    }
}
// Lay thong tin cua 1 User
exports.findOne = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        var id = req.params.id || req.query.id || req.body.id || "";
        User.findOne({
            where: {
                id
            },
            include: {
                model: Role,
                as: 'role',
                attributes: ['id'],
            },
        }).then(data => {
            if (data != null) {
                res.json({ code: 1, data });
            } else {
                res.json({ code: 0, message: "User not exist" });
            }
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }    
};

// Submit Add User
exports.AddUser = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var isblock = req.body.isblock;
        isblock = (isblock == 'on') ? true : false;
        var isactive = req.body.isactive;
        isactive = (isactive == 'on') ? true : false;
        await User.create({
            username: req.body.username,
            password: bcrypt.hashSync(req.body.password, 8),
            firstname: req.body.firstname || "",
            lastname: req.body.lastname || "",
            nickname: req.body.nickname || "",
            phone: req.body.phone,
            email: req.body.email,
            roleid: req.body.roleid || null,
            isblock: isblock,
            isactive: isactive,
            author: req.session.userid || null
        }).then(() => {            
            res.json({ code: 1, message: "User was registered successfully" });
        }).catch(() => {
            res.json({ code: 0, message: "User was registered error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }    
};

// Submit Edit User
exports.EditUser = async(req, res) => {
    try{
        var isblock = req.body.isblock;
        isblock = (isblock == 'on') ? true : false;
        var isactive = req.body.isactive;
        isactive = (isactive == 'on') ? true : false;
        var password = req.body.password || "",
            id = req.body.id || "";
        var olduser = await User.findOne({
            where: {
                id
            }
        })
        if(olduser==null){
            return errorController.render404Ajax(req, res);
        }
        // Check quyen Edit User hoac Author
        if(olduser.id != req.session.userid && olduser.author != req.session.userid){
            if(!req.roleAction || !req.roleAction.actedit){
                return errorController.render403Ajax(req, res);
            }
        }
        password = (password !== olduser.password) ? bcrypt.hashSync(password, 8) : olduser.password;
        //olduser.username = req.body.username || "";
        olduser.password = password;
        olduser.firstname = req.body.firstname || "";
        olduser.lastname = req.body.lastname || "";
        olduser.nickname = req.body.nickname || "";
        olduser.phone = req.body.phone || "";
        olduser.email = req.body.email || "";
        olduser.roleid = req.body.roleid || null;
        olduser.isblock = isblock;
        olduser.isactive = isactive;
        olduser.save();
        res.json({ code: 1, message: "User was updated success" });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// implement update columns toggle (boolean)
exports.UpdateToggleColumn = async(req, res) => {
    try {
        // Check quyen Edit banner
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403Ajax(req, res);
        }
        var col = req.body.col,
            id = req.params.id || req.body.id,
            value = req.body.value,
            str = `{"${col}" : ${value}}`,
            updateJson = JSON.parse(str);
        var rsUpdate = await User.update(updateJson, { where: { id: id } });
        if (rsUpdate) {
            res.json({ code: 1, message: "Record was updated successfully" });
        } else {
            res.json({ code: 0, message: "Record was updated error" });
        }
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}

// Delete User
exports.DeleteUser = (req, res) => {
    try{        
        var id = req.params.id || req.body.id || "",
            where = {
                id : id
            };
        if(!req.roleAction || !req.roleAction.actdel){
            where.author = req.session.userid || "";
        }
        User.destroy({
            where: where
        }).then(deleteCount => {
            if(deleteCount <= 0){
                return res.json({ code: 0, message: "User can't delete" });
            }
            return res.json({ code: 1, message: "User was deleted successfully" });
        }).catch(() => {
            return res.json({ code: 0, message: "User was deleted error" });
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }    
}

// Delete User
exports.Bulk = (req, res) => {
    try{
        var id = req.params.id || req.body.id,
        action = req.body.action;
        switch(action){
            case "delete":
                req.body.id = id;
                this.DeleteUser(req, res);
                break;
            default:
                res.json({ code: 0, message: "Unknow this bulk action" });
                break;
        }
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Phan trang trang list Users
exports.Datatable = async(req, res) => {
    try{
        var where = {},
            column = "id";
        var search = req.query.columns[1].search.value;
        var isactive = req.query.columns[2].search.value || "%";
        isactive = (isactive=="on") ? true : isactive;
        isactive = (isactive=="off") ? false : isactive;
        var isblock = req.query.columns[3].search.value || "%";
        isblock = (isblock=="on") ? false : isblock;
        isblock = (isblock=="off") ? true : isblock;
        if (search) {
            where = {
                [Op.or]: [{
                    username: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    nickname: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    phone: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    email: {
                        [Op.like]: `%${search}%`
                    }
                }]
            }
        }
		if(isactive!="%"){
            where.isactive = isactive
        }
        if(isblock!="%"){
            where.isblock = isblock
        }
        var start = Number(req.query.start);
        var length = Number(req.query.length);
        if (req.query.order[0].column == 2) column = "username";
        if (req.query.order[0].column == 3) column = "nickname";
        if (req.query.order[0].column == 4) column = "roleid";
        if (req.query.order[0].column == 5) column = "phone";
        if (req.query.order[0].column == 6) column = "email";
        if (req.query.order[0].column == 9) column = "createdAt";
        var type = req.query.order[0].dir;
        var roleAction = (req.roleAction) ? req.roleAction : {};
        if (Number.isInteger(start) && Number.isInteger(length)) {
            var users = await User.findAndCountAll({
                where: where,
                attributes: {
                    include:[
                        [sequelize.literal(`${(roleAction.actview)?roleAction.actview:0}`), 'roleview'],
                        [sequelize.literal(`${(roleAction.actadd)?roleAction.actadd:0}`), 'roleadd'],
                        [sequelize.literal(`${(roleAction.actedit)?roleAction.actedit:0}`), 'roleedit'],
                        [sequelize.literal(`${(roleAction.actdel)?roleAction.actdel:0}`), 'roledel'],
                        [sequelize.literal(`${req.session.userid}`), 'mine'],
                    ]
                },
                include:{
                    model: Role,
                    as: 'role',
                    require: false
                },
                order: [
                    [column, type]
                ],
                offset: start,
                limit: length
            });
            res.json({ aaData: users.rows, iTotalDisplayRecords: users.count, iTotalRecords: users.count });
        } else {
            res.json({ code: 0, message: "Pagination params is not valid" });
        }
    }catch(err){
        res.json({ code: 0, message: "Error" });
    }
}

