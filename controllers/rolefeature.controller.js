const config = require("config");
const dbCf = config.get("database")
const db = require("../models");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Role = db.role;
const Sitefeature = db.sitefeature;
const tbSitefeatureName = dbCf.table.prefix + "site_features";
const Rolefeature = db.rolefeature;
const errorController = require('./error.controller');

// Hien thi trang quan tri phan quyen
exports.showPage = async(req, res) =>{
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        var rid = req.params.rid || "";
        const roles = await Role.findAll({
            where:{
                ismaster: false
            },
            attributes: ['id', 'rolename']
        })
        rid = (rid == "" && roles.length > 0) ? roles[0].id : rid;
        const rolefeatures = await Rolefeature.findAll({
            where:{
                roleid: rid
            },
            include:{
                model: Sitefeature,
                as: "sitefeature",
                attributes: ['id', 'name', 'title']
            },
            order:[
                [ 'sitefeature', 'name', 'ASC' ],
            ]
        })
        var notIDs = rolefeatures.map(rf => rf.sitefeatureid);
        const sitefeatures = await Sitefeature.findAll({
            where:{
                id: {
                    [Op.notIn]: notIDs
                },
                nolink: false
            }
        })
        res.render("admin/feature-role", {roles, rolefeatures, sitefeatures, rid});
    }catch(err){
        return errorController.render500(req, res);
    }    
}
// Ajax keo tha Feature site vao Role (Gan quyen)
exports.ajaxAddRoleFeature = async(req, res) =>{
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var rid = req.body.rid || "",
            sfid = req.body.sfid || "";
        if(rid !== "" && sfid !== ""){
            const count = await Rolefeature.count({
                where:{
                    roleid: rid,
                    sitefeatureid: sfid
                }
            })
            if(count > 0){
                return res.json({code: 0, message: "This feature has been existing in this role"})
            }
            await Rolefeature.create({
                roleid: rid,
                sitefeatureid: sfid,
                actview: true,
                actadd: false,
                actedit: false,
                actdel: false
            }).then(rf =>{
                return res.json({code: 1, message: "The feature was added to this role", data: rf})
            }).catch(()=>{
                return res.json({code: 0, message: "Cant add this feature to this role"})
            })
        }
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Ajax keo tha Feature rot khoi role (Xoa quyen)
exports.ajaxRemoveRoleFeature = async(req, res) =>{
    try{
        if(!req.roleAction || !req.roleAction.actdel){
            return errorController.render403Ajax(req, res);
        }
        var rfid = req.body.rfid || req.params.rfid || "";
        Rolefeature.destroy({
            where:{
                id: rfid
            }
        }).then(() => {
            return res.json({code: 1, message: "Remove successfully"})
        }).catch(() => {
            return res.json({code: 0, message: "Remove error"})
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Ajax clear toan bo quyen cua Role
exports.ajaxClearRoleFeature = async(req, res) =>{
    try{
        if(!req.roleAction || !req.roleAction.actdel){
            return errorController.render403Ajax(req, res);
        }
        var rid = req.body.rid || req.params.rid || "";
        Rolefeature.destroy({
            where:{
                roleid: rid
            }
        }).then(() => {
            return res.json({code: 1, message: "Permission was successfully"})
        }).catch(() => {
            return res.json({code: 0, message: "Permission was error"})
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Ajax thay doi trang thai Add, Edit, Delete cua Feature trong Role
exports.ajaxChangePermissionRoleFeature = async(req, res) =>{
    try{
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403Ajax(req, res);
        }
        var rfid = req.body.rfid || req.params.rfid || "",
            col = req.body.act || "",
            actionValue = req.body.actval || "",
            str = `{"${col}" : ${actionValue}}`,
            updateJson = JSON.parse(str);
        actionValue = (actionValue=='on') ? true : false;
        Rolefeature.update(updateJson,{
            where:{
                id: rfid
            }
        }).then(() => {
            return res.json({code: 1, message: "Permission changed successfully"})
        }).catch(() => {
            return res.json({code: 0, message: "Permission changed error"})
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Lay quyen cua 1 trang cu the
exports.getRoleActionOfUrl = async(role, curUrl) =>{
    if(role.ismaster){
        return {
            actview: 1,
            actadd: 1,
            actedit: 1,
            actdel: 1
        }
    }
    var urlText = curUrl;//curUrl.replace(new RegExp(`^\/${dashboard}`,"g"), "/");
    const rsData = await Rolefeature.findOne({
        where: {
            roleid: role.id,
            sitefeatureid: [sequelize.literal(`SELECT id FROM ${tbSitefeatureName} WHERE '${urlText}' like concat(url, '%') AND url is not null AND url not like ""`)]
        },
        attributes:['actview','actadd','actedit','actdel'],
        raw: true
    })
    return rsData;
}