const config = require("config");
const dbCf = config.get("database")
const db = require("../models");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Sitefeature = db.sitefeature;
const tbRolefeatureName = dbCf.table.prefix + "role_features";
const errorController = require("./error.controller");

// Hien thi trang quan tri tinh nang site
exports.showPage = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        const sitefeatures = await Sitefeature.findAll({
            where:{
                parentid: null,
                nolink: true
            },
            attributes:['id', 'title', 'name']
        });
        res.render("admin/feature-site", {sitefeatures});
    }catch(err){
        return errorController.render500(req, res);
    }    
}
// Submit form them moi tinh nang
exports.Add = async(req, res) => {
    try {
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var nolink = (req.body.nolink == "on") ? true : false;          
        await Sitefeature.create({            
            name: req.body.name,
            icon: req.body.icon || null,
            title: req.body.name,
            description: req.body.description || "",
            url: req.body.url || "",
            nolink: nolink,
            parentid: req.body.parentid || null,
            numsort: req.body.numsort || 0
        }).then(() => {
            return res.json({code: 1, message: "Site feature was created successfully"});
        }).catch(() => {
            return res.json({code: 0, message: "Site feature was created error"});
        })
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// Submit form sua tinh nang
exports.Edit = async(req, res) => {
    try {
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.body.id,
            nolink = req.body.nolink,
            oldData = {};
        nolink = (nolink == 'on') ? true : false;
        oldData = await Sitefeature.findOne({
            where:{id: id}
        });
        if(oldData==null){            
            return res.status(404).json({code: 0, message: "Not found"});
        }
        oldData.name = req.body.name || "";
        oldData.icon = req.body.icon || null;
        oldData.title = req.body.title || "";
        oldData.description = req.body.description || "";
        oldData.url = req.body.url || "";
        oldData.nolink = nolink;
        oldData.parentid = req.body.parentid || null;
        oldData.numsort = req.body.numsort || 0;
        oldData.save();
        return res.json({code: 1, message: "Site feature was updated successfully"});
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// Lay thong tin cua 1 tinh nang
exports.findOne = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.query.id || req.body.id;
        Sitefeature.findOne({
            where: {
                id
            }
        }).then(data => {
            if (data != null) {
                res.json({ code: 1, data });
            } else {
                res.json({ code: 0, message: "Feature not exist" });
            }
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }    
}
// Thuc hien button Bulk o trang List
exports.Bulk = async(req, res) => {
    try {
        var ids = req.body.id;
        var action = req.body.action;
        switch (action) {
            case "delete":
                req.body.id = ids;
                this.Delete(req, res);
                break;
            default:
                res.json({ code: 0, message: "This action is not exist" });
                break;
        }
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// Ajax update trang thai 1 cot o trang List
exports.UpdateToggleColumn = async(req, res) => {
    try {
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403Ajax(req, res);
        }
        var col = req.body.col,
            id = req.params.id || req.body.id,
            value = req.body.value,
            str = `{"${col}" : ${value}}`,
            updateJson = JSON.parse(str);
        var rsUpdate = await Sitefeature.update(updateJson, { where: { id: id } });
        if (rsUpdate) {
            res.json({ code: 1, message: "Record was updated successfully" });
        } else {
            res.json({ code: 0, message: "Record was updated error" });
        }
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }

}
// Xoa tinh nang
exports.Delete = async(req, res) => {
    try {
        if(!req.roleAction || !req.roleAction.actdel){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.body.id,
            rsDestroy = await Sitefeature.destroy({
                where: {
                    id: id
                }
            });
        if (rsDestroy) {
            res.json({ code: 1, message: "Records was deleted successfully" });
        } else {
            res.json({ code: 0, message: "Records was deleted error" });
        }
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// Load du lieu phan trang Datatable
exports.Datatable = async(req, res) => {
    try {
        var where = {},
            search = req.query.columns[1].search.value,
            parent = req.query.columns[2].search.value || "%",
            offset = Number(req.query.start) || 0,
            length = Number(req.query.length) || 10,
            sortColumn = "id",
            sortType = req.query.order[0].dir || "DESC";
        sortColumn = (req.query.order[0].column == 2) ? "name" : sortColumn;
        sortColumn = (req.query.order[0].column == 3) ? "title" : sortColumn;
        sortColumn = (req.query.order[0].column == 4) ? "description" : sortColumn;
        sortColumn = (req.query.order[0].column == 5) ? "url" : sortColumn;
        sortColumn = (req.query.order[0].column == 6) ? "parentid" : sortColumn;
        sortColumn = (req.query.order[0].column == 8) ? "createdAt" : sortColumn;
        if (search) {
            where = {                
                [Op.or]: [{
                    name: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    title: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    description: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    '$parent.name$': {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    '$parent.title$': {
                        [Op.like]: `%${search}%`
                    }
                }]
            }
        }
        if(parent !== "%"){
            where.parentid = parent;
        }
        var roleAction = (req.roleAction) ? req.roleAction : {};
        var rsData = await Sitefeature.findAndCountAll({
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
                model: Sitefeature,
                as: "parent",
                attributes: ['id', 'name', 'title'],
                required: false
            },
            order: [
                [sortColumn, sortType]
            ],            
            offset: offset,
            limit: length
        });
        res.json({ aaData: rsData.rows, iTotalDisplayRecords: rsData.count, iTotalRecords: rsData.count });
    } catch (err) { 
        res.json({ code: 0, message: "Error" });
    }
}
// Lay danh sach tinh nang cua 1 Role cu the lam menu Admin
exports.getAdminMenuOfRole = async(role) => {
    var rsData = [];
    try{        
        if(role==null) return rsData;
        if(role.ismaster){
            rsData = await Sitefeature.findAll({
                attributes: ['id', 'parentid', 'icon','name','title','url','nolink'],
                order:[
                    ['numsort', 'ASC']
                ],
                raw: true
            });
        }else{
            rsData = await Sitefeature.findAll({
                where:{
                    [Op.or]:[
                        {nolink: true},
                        {
                            id: {
                                [Op.in]: [sequelize.literal(`SELECT sitefeatureid FROM ${tbRolefeatureName} WHERE roleid=${role.id}`)]
                            }
                        }
                    ]
                },
                attributes: ['id', 'parentid', 'icon','name','title','url','nolink'],
                order:[
                    ['numsort', 'ASC']
                ],
                raw: true
            })
        }
        rsData = (rsData.length > 0) ? functions.createHierarchy(rsData) : rsData;
        return rsData;
    }catch(err){
        return rsData;
    }
}