const db = require("../models");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Language = db.language;
const errorController = require("./error.controller");

// Hien thi trang list languages
exports.ListLanguage = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        res.render("admin/language");
    }catch(err){
        return errorController.render500(req, res);
    }    
}

// Lay thong tin 1 language
exports.findOne = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.query.id || req.body.id;
        Language.findOne({
            where: {
                id
            }
        }).then(data => {
            if (data != null) {
                res.json({ code: 1, data });
            } else {
                res.json({ code: 0, message: "Language not exist" });
            }
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Submit add language
exports.AddLanguage = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var isblock = req.body.isblock;
        isblock = (isblock == 'on') ? true : false;
        await Language.create({
            id: req.body.id,
            name: req.body.name,
            codelang: req.body.codelang,
            area: req.body.area,
            description: req.body.description,
            isblock: isblock
        }).then(() => {
            res.json({ code: 1, message: "Language was created successfully" });
        }).catch(() => {
            res.json({ code: 0, message: "Language was created error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }    
};

// Submit edit language
exports.EditLanguage = (req, res) => {
    try{        
        var isblock = req.body.isblock;
        isblock = (isblock == 'on') ? true : false;
        var id = req.body.id || "";
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403Ajax(req, res);
        }
        Language.update({
            name: req.body.name,
            codelang: req.body.codelang,
            description: req.body.description,
            area: req.body.area,
            isblock: isblock
        }, {
            where: {
                id
            }
        }).then(() => {
            res.json({ code: 1, message: "Language was updated success" });
        }).catch(() => {
            res.json({ code: 0, message: "Language was updated error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    } 
}

// delete language
exports.DeleteLanguage = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actdel){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.body.id || "";
        Language.destroy({
            where: {
                id
            }
        }).then(() => {
            res.json({ code: 1, message: "Language was deleted successfully" });
        }).catch(() => {
            res.json({ code: 0, message: "Language was deleted error" });
        })
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
        var rsUpdate = await Language.update(updateJson, { where: { id: id } });
        if (rsUpdate) {
            res.json({ code: 1, message: "Record was updated successfully" });
        } else {
            res.json({ code: 0, message: "Record was updated error" });
        }
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}

// delete language
exports.Bulk = (req, res) => {
    try{
        var id = req.params.id || req.body.id,
        action = req.body.action;
        switch(action){
            case "delete":
                req.body.id = id;
                this.DeleteLanguage(req, res);
                break;
            default:
                res.json({code: 0, message: "Unknow this bulk action"});
                break;
        }
    }catch(err){
        return errorController.render500Ajax(req, res);
    }    
}

// Phan trang list language
exports.Datatable = async(req, res) => {
    try{
        var where = {},
            column = "id";
        var search = req.query.columns[1].search.value;
        var isblock = req.query.columns[2].search.value || "%";
        isblock = (isblock=="on") ? false : isblock;
        isblock = (isblock=="off") ? true : isblock;
        if (search) {
            where = {
                [Op.or]: [{
                    id: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    name: {
                        [Op.like]: `%${search}%`
                    }
                }]
            }
        }
        if(isblock!="%"){
            where.isblock = isblock;
        }
        var start = Number(req.query.start);
        var length = Number(req.query.length);
        if (req.query.order[0].column == 0) column = "id";
        if (req.query.order[0].column == 2) column = "name";
        if (req.query.order[0].column == 3) column = "codelang";
        var type = req.query.order[0].dir;
        var roleAction = (req.roleAction) ? req.roleAction : {};
        if (Number.isInteger(start) && Number.isInteger(length)) {
            const langs = await Language.findAndCountAll({
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
            res.json({ aaData: langs.rows, iTotalDisplayRecords: langs.count, iTotalRecords: langs.count });
        } else {
            res.json({ code: 0, message: "Pagination params is not valid" });
        }
    }catch(err){
        res.json({code: 0, message: "Error"});
    }
}