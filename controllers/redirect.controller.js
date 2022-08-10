const db = require("../models");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Redirect = db.redirect;
const User = db.user;
const errorController = require("./error.controller");

// Hien thi danh sach link redirect 
exports.ListRedirect = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        res.render("admin/redirect");
    }catch(err){
        return errorController.render500(req, res);
    }    
}

// Lay thong tin 1 link redirect
exports.findOne = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        var id = req.params.id || req.query.id || req.body.id || "";
        Redirect.findOne({
            where: {
                id
            }
        }).then(data => {
            if (data != null) {
                res.json({ code: 1, data });
            } else {
                res.json({ code: 0, message: "Link transfer not exist" });
            }
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }    
}

// Submit add redirect
exports.AddRedirect = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var isblock = req.body.isblock;
        isblock = (isblock == 'on') ? true : false;
        await Redirect.create({
            oldslug: req.body.oldslug,
            newslug: req.body.newslug,
            type: req.body.type,
            objtype: req.body.objtype,
            author: req.session.userid || null,
            isblock: isblock
        }).then(() => {
            res.json({ code: 1, message: "Link transfer was added successfully" });
        }).catch(() => {
            res.json({ code: 0, message: "Link transfer was added error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }    
}

// Submit edit redirect
exports.EditRedirect = async(req, res) => {
    try{
        var id = req.body.id || "";
        var isblock = req.body.isblock;
        isblock = (isblock == 'on') ? true : false;
        var redirect = await Redirect.findOne({
            where:{
                id:id
            }
        })
        // Redirect khong ton tai
        if(redirect==null){
            return errorController.render404Ajax(req, res);
        }
        // Check quyen Edit hoac Author
        if(redirect.author != req.session.userid){
            if(!req.roleAction || !req.roleAction.actedit){
                return errorController.render403Ajax(req, res);
            }
        }
        // Thuc hien update
        Redirect.update({
            oldslug: req.body.oldslug,
            newslug: req.body.newslug,
            type: req.body.type,
            objtype: req.body.objtype,
            isblock: isblock,
        }, {
            where: {
                id
            }
        }).then(() => {
            res.json({ code: 1, message: "Link transfer was updated success" });
        }).catch(() => {
            res.json({ code: 0, message: "Link transfer was updated error" });
        });
    }catch(err){
        console.log(err)
        return errorController.render500Ajax(req, res);
    }    
}

// Thay doi trang thai Redirect
exports.UpdateToggleColumn = async(req, res) => {
    try {        
        var id = req.params.id || req.body.id || "",
            col = req.body.col,
            value = req.body.value;            
        value = (value=="on") ? true : false;
        var str = `{"${col}" : ${value}}`,
            updateJson = JSON.parse(str);
        var redirect = await Redirect.findOne({
            where:{
                id: id
            }
        })
        // Redirect khong ton tai
        if(redirect==null){
            return errorController.render404Ajax(req, res);
        }
        // Check quyen Edit hoac Author
        if(redirect.author != req.session.userid){
            if(!req.roleAction || !req.roleAction.actedit){
                return errorController.render403Ajax(req, res);
            }
        }        
        var rsUpdate = await Redirect.update(updateJson, { where: { id: id } });
        if(rsUpdate<=0){
            return res.json({ code: 0, message: "Record was updated error" });
        }
        return res.json({ code: 1, message: "Record was updated successfully" });
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}

// Delete redirect
exports.DeleteRedirect = (req, res) => {
    try{
        var id = req.params.id || req.body.id || "",
            where = {
                id: id
            };
        if(!req.roleAction || !req.roleAction.actdel){
            where.author = req.session.userid || "";
        }
        Redirect.destroy({
            where: where
        }).then(() => {
            res.json({ code: 1, message: "Link transfer was deleted successfully" });
        }).catch(() => {
            res.json({ code: 0, message: "Link transfer was deleted error" });
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }    
};

// Bulk action Redirect
exports.Bulk = (req, res) => {
    try{
        var id = req.body.id;
        var action = req.body.action;
        switch (action) {
            case "delete":
                req.body.id = id;
                this.DeleteRedirect(req, res);
                break;
        }
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Phan trang redirect
exports.Datatable = async(req, res) => {
    try{
        var where = {},
            column = "id";
        var search = req.query.columns[1].search.value;
        var objtype = req.query.columns[2].search.value || "%";
        var isblock = req.query.columns[3].search.value || "%";
        isblock = (isblock=="on") ? false : isblock;
        isblock = (isblock=="off") ? true : isblock;
        search = (search == undefined || search == null || search == "") ? "" : search;
        if (search) {
            where = {
                [Op.or]: {
                    oldslug: {
                        [Op.like]: `%${search}%`
                    },
                    newslug: {
                        [Op.like]: `%${search}%`
                    }
                }
            }
        }
        if(objtype!="%"){
            where.objtype = objtype;
        }
        if(isblock!="%"){
            where.isblock = isblock;
        }
        var start = Number(req.query.start);
        var length = Number(req.query.length);
        if (req.query.order[0].column == 1) column = "oldslug";
        if (req.query.order[0].column == 2) column = "newslug";
        if (req.query.order[0].column == 4) column = "type";
        if (req.query.order[0].column == 5) column = "objtype";
        if (req.query.order[0].column == 7) column = "updatedAt";
        var type = req.query.order[0].dir;
        var roleAction = (req.roleAction) ? req.roleAction : {};
        if (Number.isInteger(start) && Number.isInteger(length)) {
            var redirects = await Redirect.findAndCountAll({
                where: where,
                include:[{
                    model: User,
                    as:'Author',
                    attributes:['id', 'username']
                }],
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
            res.json({ aaData: redirects.rows, iTotalDisplayRecords: redirects.count, iTotalRecords: redirects.count });            
        } else {
            res.json({ code: 0, message: "Pagination params is not valid" });
        }
    }catch(err){
        res.json({ code: 0, message: "Error page" });
    }
}

// Auto tao redirect khi thay doi slug
exports.createRedirectWhenChangeSlug = async (typePage, typeRedirect, oldSlug, newSlug, author) =>{
    await Redirect.update({
        newslug: newSlug
    }, {
        where: {
            newslug: oldSlug,
            objtype: typePage
        }
    });
    await Redirect.create({
        oldslug: oldSlug,
        newslug: newSlug,
        type: typeRedirect,
        objtype: typePage,
        isblock: false,
        author: author
    });
    await Redirect.update({
        isblock: true
    }, {
        where: {
            oldslug: {
                [Op.eq]: db.sequelize.col('newslug')
            }
        }
    });
}