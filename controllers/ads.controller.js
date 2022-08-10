const db = require("../models");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Ads = db.ads;
const User = db.user;
const errorController = require("./error.controller");

//Hien thi trang list ads
exports.ListAds = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        res.render("admin/ads");
    }catch(err){
        return errorController.render500(req, res);
    }    
}

// Lay thong tin 1 ads
exports.findOne = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.query.id || req.body.id || "";
        Ads.findOne({
            where: {
                id
            }
        }).then(data => {
            if (data != null) {
                res.json({ code: 1, data });
            } else {
                res.json({ code: 0, message: "Ads not exist" });
            }
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Submit add Ads
exports.AddAds = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var isblock = req.body.isblock;
        isblock = (isblock == 'on') ? true : false;
        var appearheader = req.body.appearheader;
        appearheader = (appearheader == 'on') ? true : false;
        var islazy = req.body.islazy;
        islazy = (islazy == 'on') ? true : false;
        var offads = req.body.offads;
        offads = (offads == 'on') ? true : false;
        var isheader = req.body.isheader;
        isheader = (isheader == 'on') ? true : false;
        var isdefault = req.body.isdefault;
        isdefault = (isdefault == 'on') ? true : false;
        await Ads.create({
            adscode: req.body.adscode,
            name: req.body.name,
            slot1: req.body.slot1,
            slot2: req.body.slot2,
            slot3: req.body.slot3,
            slot4: req.body.slot4,
            slot5: req.body.slot5,
            slot6: req.body.slot6,
            appearheader: appearheader,
            islazy: islazy,
            offads: offads,
            isheader: isheader,
            isdefault: isdefault,
            isblock: isblock,
            author: req.session.userid || null
        }).then(() => {            
            res.json({ code: 1, message: "Ads was created successfully" });
        }).catch(() => {
            res.json({ code: 0, message: "Ads was created error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Submit edit Ads
exports.EditAds = async(req, res) => {
    try{        
        var isblock = req.body.isblock;
        isblock = (isblock == 'on') ? true : false;
        var appearheader = req.body.appearheader;
        appearheader = (appearheader == 'on') ? true : false;
        var islazy = req.body.islazy;
        islazy = (islazy == 'on') ? true : false;
        var offads = req.body.offads;
        offads = (offads == 'on') ? true : false;
        var isheader = req.body.isheader;
        isheader = (isheader == 'on') ? true : false;
        var isdefault = req.body.isdefault;
        isdefault = (isdefault == 'on') ? true : false;
        var id = req.body.id;
        var ads = await Ads.findOne({
            where:{
                id: id
            }
        })
        // Ads khong ton tai
        if(ads == null){
            return errorController.render404Ajax(req, res);
        }
        // Check quyen Edit hoac Author
        if(ads.author != req.session.userid){
            if(!req.roleAction || !req.roleAction.actedit){
                return errorController.render403Ajax(req, res);
            }
        }
        // Update Ads
        Ads.update({
            adscode: req.body.adscode,
            name: req.body.name,
            slot1: req.body.slot1,
            slot2: req.body.slot2,
            slot3: req.body.slot3,
            slot4: req.body.slot4,
            slot5: req.body.slot5,
            slot6: req.body.slot6,
            appearheader: appearheader,
            islazy: islazy,
            offads: offads,
            isheader: isheader,
            isdefault: isdefault,
            isblock: isblock
        }, {
            where: {
                id
            }
        }).then(() => {
            res.json({ code: 1, message: "Ads was updated success" });
        }).catch(() => {
            res.json({ code: 0, message: "Ads was updated error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// implement update columns toggle (boolean)
exports.UpdateToggleColumn = async(req, res) => {
    try {        
        var col = req.body.col,
            id = req.params.id || req.body.id,
            value = req.body.value,
            str = `{"${col}" : ${value}}`,
            updateJson = JSON.parse(str);
        const curAds = await Ads.findOne({
            where:{
                id:id
            },
            attributes: ['id', 'author']
        })
        // Ads khong ton tai
        if(curAds == null){
            return errorController.render404Ajax(req, res);
        }
        // Check quyen Edit Edit hoac Author 
        if(curAds.author != req.session.userid){            
            if(!req.roleAction || !req.roleAction.actedit){
                return errorController.render403Ajax(req, res);
            }
        }
        // Thuc hien edit
        var rsUpdate = await Ads.update(updateJson, { where: { id: id } });
        if (rsUpdate) {
            res.json({ code: 1, message: "Record was updated successfully" });
        } else {
            res.json({ code: 0, message: "Record was updated error" });
        }
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }

}

// Delete Ads
exports.DeleteAds = (req, res) => {
    try{
        var id = req.params.id || req.body.id || "",
            where = {
                id: id
            };
        if(!req.roleAction || !req.roleAction.actedit){
            where.author = req.session.userid || "";
        }
        Ads.destroy({
            where: where
        }).then(updatedCount => {
            if(updatedCount <= 0){
                return res.json({ code: 0, message: "Ads can't delete" });
            }
            res.json({ code: 1, message: "Ads was deleted successfully" });
        }).catch(() => {
            res.json({ code: 0, message: "Ads was deleted error" });
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Bulk action Ads
exports.Bulk = (req, res) => {
    try{
        var id = req.params.id || req.body.id || "",
            action = req.body.action;
            switch(action){
                case "delete":
                    req.body.id = id;
                    this.DeleteAds(req, res);
                    break;
                default:
                    res.json({ code: 0, message: "Unknow this bulk action" });
                    break;
            }
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Phan trang list Ads
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
                    adscode: {
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
            where.isblock = isblock
        }
        var start = Number(req.query.start);
        var length = Number(req.query.length);
        if (req.query.order[0].column == 0) column = "id";
        if (req.query.order[0].column == 1) column = "adscode";
        if (req.query.order[0].column == 2) column = "name";
        var type = req.query.order[0].dir;
        var roleAction = (req.roleAction) ? req.roleAction : {};
        if (Number.isInteger(start) && Number.isInteger(length)) {
            var adss = await Ads.findAndCountAll({
                where: where,
                include: {
                    model: User,
                    as: 'Author',
                    attributes: ['id', 'username']
                },
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
            res.json({ aaData: adss.rows, iTotalDisplayRecords: adss.count, iTotalRecords: adss.count });
        } else {
            res.json({ code: 0, message: "Pagination params is not valid" });
        }
    }catch(err){
        console.log(err);
        res.json({ code: 0, message: "Error" });
    }
}