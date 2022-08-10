const db = require("../models");
const Op = db.Sequelize.Op;
const LogAutoUpdateVersion = db.logupdateversion;
const Post = db.post;
const errorController = require("./error.controller");

// Lay danh sach co version moi nhung khong update duoc SEO Title
exports.getAppErrorUpdateVersionList = async() => {
    try{
        var dateFindLog = new Date();
        dateFindLog.setMinutes(dateFindLog.getMinutes() - (60 * 24)); // 24h qua
        var errAutoUpdate = await LogAutoUpdateVersion.findAndCountAll({
            where:{
                approved: false,
                logtype:"error",
                createdAt:{
                    [Op.gte]: dateFindLog
                }
            },
            include:{
                model: Post,
                as: 'post',
                attributes: ['slug']
            },
            order:[["createdAt", "DESC"]],
            limit: 50
        })        
        return errAutoUpdate;
    }catch(err){
        return {count: 0, rows: []};
    }
}
// Lay danh sach da update version thanh cong trong ngay
exports.getAppSuccessUpdateVersionList = async() => {
    try{
        var dateFindLog = new Date();
        dateFindLog.setMinutes(dateFindLog.getMinutes() - (60 * 24)); // 24h qua
        var successAutoUpdate = await LogAutoUpdateVersion.findAndCountAll({
            where:{
                logtype:"success",
                createdAt:{
                    [Op.gte]: dateFindLog
                }
            },
            include:{
                model: Post,
                as: 'post',
                attributes: ['slug']
            },
            order:[["createdAt", "DESC"]],
            limit: 50
        })
        return successAutoUpdate;
    }catch(err){
        return {count: 0, rows: []};
    }
}

// Hien thi trang Log Auto Update
exports.showList = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        return res.render("admin/logautoupdate");
    }catch(err){
        return errorController.render500(req, res);
    }
}

// Phan trang trang list Log Auto Update
exports.Datatable = async(req, res) => {
    try{
        var where = {},
            column = "createdAt";
        var fdate = req.query.columns[1].search.value || "";
        var tdate = req.query.columns[2].search.value || "";
        var search = req.query.columns[3].search.value;
        var logtype = req.query.columns[4].search.value || "%";
        fdate = functions.create_date_from_string(fdate, false);
        tdate = functions.create_date_from_string(tdate, true);
        if(fdate !== ""){
            where.createdAt = {[Op.between] : [fdate , tdate ]}
        }
        if (search) {
            where = {
                [Op.or]: [{
                    postname: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    oldtitle: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    newtitle: {
                        [Op.like]: `%${search}%`
                    }
                }]
            }
        }
        if(logtype != "%"){
            where.logtype = logtype;
        }
        var start = Number(req.query.start);
        var length = Number(req.query.length);        
        if (req.query.order[0].column == 0) column = "createdAt";
        if (req.query.order[0].column == 1) column = "postname";
        if (req.query.order[0].column == 4) column = "errormsg";
        if (req.query.order[0].column == 5) column = "oldtitle";
        if (req.query.order[0].column == 6) column = "newtitle";
        var type = req.query.order[0].dir;
        if (Number.isInteger(start) && Number.isInteger(length)) {
            var rs = await LogAutoUpdateVersion.findAndCountAll({
                where: where,                
                order: [
                    [column, type]
                ],
                include:{
                    model: Post,
                    as: 'post',
                    attributes: ['slug']
                },
                offset: start,
                limit: length
            });
            res.json({ aaData: rs.rows, iTotalDisplayRecords: rs.count, iTotalRecords: rs.count });
        } else {
            res.json({ code: 0, message: "Pagination params is not valid" });
        }
    }catch(err){
        res.json({ code: 0, message: "Error" });
    }
}