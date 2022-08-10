const db = require("../models");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Type = db.type;
const errorController = require("./error.controller");

//show page type in admin
exports.showPage = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        res.render("admin/type");
    }catch(err){
        return errorController.render500(req, res);
    }
}
//show page add type in admin
exports.showPageAdd = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403(req, res);
        }
        const listTypes = await Type.findAll({order:[["description","ASC"]]});
        res.render("admin/type-add",{listTypes});
    }catch(err){
        return errorController.render500(req, res);
    }
}
//show page add type in admin
exports.showPageEdit = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403(req, res);
        }
        var id = req.params.id || "";
        const listTypes = await Type.findAll({order:[["description","ASC"]]});
        const type = await Type.findOne({
            where:{
                id: id
            },
            include:[{
                model: Type,
                as: "catetype",
                required: false
            },
            {
                model: Type,
                as: "posttype",
                required: false
            }]
        });
        if(type==null){
            return res.redirect(`/${dashboard}/type/add`);
        }
        res.render("admin/type-edit", {type, listTypes});
    }catch(err){
        return errorController.render500(req, res);
    }
}
//implement page add type in admin
exports.Add = async(req, res) => {
    try {
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403(req, res);
        }
        var isblock = (req.body.isblock == "on") ? true : false,
            hassitemap = (req.body.hassitemap == "on") ? true : false,
            allowfollow = (req.body.allowfollow == "on") ? true : false,
            allowindex = (req.body.allowindex == "on") ? true : false,
            type = (req.body.type) ? req.body.type : "";
        await Type.create({
            id: req.body.id,
            name: req.body.name,
            description: req.body.description || "",
            roottext: req.body.roottext || "",
            exttext: req.body.exttext || "",
            type: req.body.type,            
            allowfollow: allowfollow,
            allowindex: allowindex,
            hassitemap: hassitemap,
            isblock: isblock
        }).then(createdType => {
            if(type=="post" && req.body.catetype){
                createdType.setCatetype(req.body.catetype || []);
            }
            if(type=="category" && req.body.posttype){
                createdType.setPosttype(req.body.posttype || []);
                createdType.cateitemtype = req.body.cateitemtype || null;
            }
            createdType.save();
            res.redirect(`/${dashboard}/type/edit/${createdType.id}`);
        }).catch(() => {
            return errorController.render500(req, res);
        })
    } catch (err) {
        return errorController.render500(req, res);
    }
}
//implement page edit type in admin
exports.Edit = async(req, res) => {
    try {
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403(req, res);
        }
        var id = req.params.id,
            isblock = (req.body.isblock == "on") ? true : false,
            hassitemap = (req.body.hassitemap == "on") ? true : false,
            allowfollow = (req.body.allowfollow == "on") ? true : false,
            allowindex = (req.body.allowindex == "on") ? true : false,
            oldType = {};
        oldType = await Type.findOne({
            where:{id: id}
        });
        if(oldType==null){
            res.status(404);
            return res.send("Not found");
        }
        oldType.name = req.body.name || "";
        oldType.description = req.body.description || "";
        oldType.roottext = req.body.roottext || "";
        oldType.exttext = req.body.exttext || "";
        oldType.allowfollow = allowfollow;
        oldType.allowindex = allowindex;
        oldType.hassitemap = hassitemap;
        oldType.isblock = isblock;
        oldType.setCatetype(req.body.catetype || []);
        oldType.setPosttype(req.body.posttype || []);
        oldType.cateitemtype = req.body.cateitemtype || null;
        oldType.save();
        res.redirect(`/${dashboard}/type/edit/${id}`);        
    } catch (err) {
        return errorController.render500(req, res);
    }
}
//implement bulk action
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
// implement update columns toggle (boolean)
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
        var rsUpdate = await Type.update(updateJson, { where: { id: id } });
        if (rsUpdate) {
            res.json({ code: 1, message: "Record was updated successfully" });
        } else {
            res.json({ code: 0, message: "Record was updated error" });
        }
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }

}
// implement delete type
exports.Delete = async(req, res) => {
    try {
        if(!req.roleAction || !req.roleAction.actdel){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.body.id,
            rsDestroy = await Type.destroy({
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
// load data for datatable
exports.Datatable = async(req, res) => {
    try {
        var where = {},
            search = req.query.columns[1].search.value,
            type = req.query.columns[2].search.value || "%",
            offset = Number(req.query.start) || 0,
            length = Number(req.query.length) || 10,
            sortColumn = "id",
            sortType = req.query.order[0].dir || "DESC";
        sortColumn = (req.query.order[0].column == 1) ? "name" : sortColumn;
        sortColumn = (req.query.order[0].column == 2) ? "description" : sortColumn;
        sortColumn = (req.query.order[0].column == 3) ? "roottext" : sortColumn;
        sortColumn = (req.query.order[0].column == 4) ? "exttext" : sortColumn;
        sortColumn = (req.query.order[0].column == 5) ? "type" : sortColumn;
        sortColumn = (req.query.order[0].column == 6) ? "cateitemtype" : sortColumn;
        if (search) {
            where = {
                [Op.or]: [{
                    name: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    description: {
                        [Op.like]: `%${search}%`
                    }
                }]
            }
        }
        if (type != "%") {
            where.type = type;
        }
        var roleAction = (req.roleAction) ? req.roleAction : {};
        const types = await Type.findAndCountAll({
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
                [sortColumn, sortType]
            ],
            offset: offset,
            limit: length
        });
        res.json({ aaData: types.rows, iTotalDisplayRecords: types.count, iTotalRecords: types.count });
    } catch (err) {
        res.json({ code: 0, message: "Error" });
    }
}