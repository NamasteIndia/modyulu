const db = require("../models");
const sequelize = db.Sequelize;
const Banner = db.banner;
const Language = db.language;
const errorController = require("./error.controller");

// Hien thi trang quan tri banner trong Admin
exports.showPage = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        const banners = await Banner.findAll();
        const languages = await Language.findAll({
            where:{
                isblock: false
            },
            attributes:['id', 'name']
        })
        res.render("admin/banner", {banners, languages});
    }catch(err){
        return errorController.render500(req, res);
    }
}

// Lay thong tin cua 1 Banner
exports.findOne = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.query.id || req.body.id || "";
        const data = await Banner.findOne({
            where:{
                id: id
            }
        })
        if(data == null){
            return errorController.render404Ajax(req, res);
        }
        return res.json({ code: 1, data });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Ajax sumbit add banner trong admin
exports.Add = async(req, res) => {
    try {
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var isblock = (req.body.isblock == "on") ? true : false,
            isdefault = (req.body.default == "on") ? true : false;
        await Banner.create({            
            default: isdefault,
            langid: req.body.langid,
            img: req.body.img || "",
            url: req.body.url || "",
            title: req.body.title || "",
            isblock: isblock
        }).then(() => {            
            res.json({code: 1, message: "Banner was created Successfully"});
        }).catch(() => {            
            res.json({code: 0, message: "Banner was created error"});
        })
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}

// Ajax sumbit edit banner trong admin
exports.Edit = async(req, res) => {
    try {
        // Check quyen Edit banner
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403Ajax(req, res);
        }      
        var id = req.params.id || req.body.id || "",
            isblock = (req.body.isblock == "on") ? true : false,
            isdefault = (req.body.default == "on") ? true : false
            oldBanner = {};
        oldBanner = await Banner.findOne({
            where:{id: id}
        });
        if(oldBanner==null){            
            return errorController.render404Ajax(req, res);
        }        
        oldBanner.langid = req.body.langid;
        oldBanner.img = req.body.img || "";
        oldBanner.url = req.body.url || "";
        oldBanner.title = req.body.title || "";
        oldBanner.isblock = isblock;
        oldBanner.default = isdefault;
        oldBanner.save();
        res.json({code:1, message: "Banner was updated successfully"});
    } catch (err) {        
        return errorController.render500Ajax(req, res);
    }
}

// Delete Banner
exports.Delete = async(req, res) => {
    try {
        // Check quyen Delete banner
        if(!req.roleAction || !req.roleAction.actdel){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.body.id,
            rsDestroy = await Banner.destroy({
                where: {
                    id: id
                }
            });
        if (rsDestroy <= 0) {
            return res.json({ code: 0, message: "Records was deleted error" });
        }
        return res.json({ code: 1, message: "Records was deleted successfully" });
    } catch (err) {
        return errorController.render500Ajax(req, res);
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
        // Check quyen Edit banner
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403Ajax(req, res);
        }
        var col = req.body.col,
            id = req.params.id || req.body.id,
            value = req.body.value,
            str = `{"${col}" : ${value}}`,
            updateJson = JSON.parse(str);
        var rsUpdate = await Banner.update(updateJson, { where: { id: id } });
        if (rsUpdate) {
            res.json({ code: 1, message: "Record was updated successfully" });
        } else {
            res.json({ code: 0, message: "Record was updated error" });
        }
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }

}

// Phan trang trang Banner
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
                    langid: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    url: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    img: {
                        [Op.like]: `%${search}%`
                    }
                }]
            }
        }
        if(isblock!="%"){
            where.isblock = isblock
        }
        var start = Number(req.query.start);
        var length = Number(req.query.length);
        if (req.query.order[0].column == 1) column = "langid";
        if (req.query.order[0].column == 2) column = "title";
        if (req.query.order[0].column == 3) column = "img";
        if (req.query.order[0].column == 4) column = "url";
        if (req.query.order[0].column == 5) column = "default";
        var type = req.query.order[0].dir;
        var roleAction = (req.roleAction) ? req.roleAction : {};
        if (Number.isInteger(start) && Number.isInteger(length)) {
            var banner = await Banner.findAndCountAll({
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
            res.json({ aaData: banner.rows, iTotalDisplayRecords: banner.count, iTotalRecords: banner.count });
        } else {
            res.json({ code: 0, message: "Pagination params is not valid" });
        }
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}