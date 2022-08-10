const db = require("../models");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Role = db.role;
const config = require("config");
const dbCf = config.get("database");
const tbUserName = dbCf.table.prefix + "users";
const errorController = require("./error.controller");

// Hien thi trang list roles
exports.ListRole = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        res.render("admin/role");
    }catch(err){
        return errorController.render500(req, res);
    }    
}

// Lay thong tin cua 1 role
exports.findOne = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.query.id || req.body.id || "";
        Role.findOne({
            where: {
                id
            }
        }).then(data => {
            if (data != null) {
                res.json({ code: 1, data });
            } else {
                res.json({ code: 0, message: "Role not exist" });
            }
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }  
}

// Sumbit add role
exports.AddRole = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var ismaster = req.body.ismaster;
        ismaster = (ismaster=='on') ? true : false;
        await Role.create({
            rolename: req.body.rolename,
            description: req.body.description,
            ismaster: ismaster
        }).then(() => {
            res.json({ code: 1, message: "Role was added successfully" });
        }).catch(err => {
            res.json({ code: 0, message: "Role was added error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    } 
}

// Sumbit edit role
exports.EditRole = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403Ajax(req, res);
        }
        var id = req.body.id,
            ismaster = req.body.ismaster;
        ismaster = (ismaster=='on') ? true : false;
        Role.update({
            rolename: req.body.rolename,
            description: req.body.description,
            ismaster: ismaster
        }, {
            where: {
                id
            }
        }).then(() => {
            res.json({ code: 1, message: "Role was updated success" });
        }).catch(() => {
            res.json({ code: 0, message: "Role was updated error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    } 
}

// Delete role
exports.DeleteRole = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actdel){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.body.id || "";
        Role.destroy({
            where: {
                id
            }
        }).then(() => {
            res.json({ code: 1, message: "Role was deleted successfully" });
        }).catch(() => {
            res.json({ code: 0, message: "Role was deleted error" });
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    } 
}

// Bulk action role
exports.Bulk = (req, res) => {
    try{
        var id = req.params.id || req.body.id || "",
            action = req.body.action;
            switch(action){
                case "delete":
                    req.body.id = id;
                    this.DeleteRole(req, res);
                    break;
                default:
                    res.json({code: 0, message: "Unknow this bulk action"});
                    break;
            }
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Phan trang list role
exports.Datatable = async(req, res) => {
    try{
        var where = {},
            column = "id";
        var search = req.query.columns[1].search.value;
        if (search) {
            where = {
                rolename: {
                    [Op.like]: `%${search}%`
                }
            }
        }
        var start = Number(req.query.start);
        var length = Number(req.query.length);
        if (req.query.order[0].column == 0) column = "id";
        if (req.query.order[0].column == 1) column = "rolename";
        if (req.query.order[0].column == 2) column = "description";
        var type = req.query.order[0].dir;
        var roleAction = (req.roleAction) ? req.roleAction : {};
        if (Number.isInteger(start) && Number.isInteger(length)) {
            var roles = await Role.findAndCountAll({
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
                order: [
                    [column, type]
                ],
                offset: start,
                limit: length
            });
            res.json({ aaData: roles.rows, iTotalDisplayRecords: roles.count, iTotalRecords: roles.count });
        } else {
            res.json({ code: 0, message: "Pagination params is not valid" });
        }
    }catch(err){
        res.json({ code: 0, message: "Error" });
    }
}

// Get Role by UserId
exports.getRoleByUserId = async(userID) =>{
    try{
        const role = await Role.findOne({
            where: {
                id: [sequelize.literal(`SELECT roleid from ${tbUserName} WHERE id = ${userID}`)]
            },
            attributes:['id', 'rolename', 'ismaster'],
            raw: true
        })
        return role;
    }catch(err){
        return null;
    }
}