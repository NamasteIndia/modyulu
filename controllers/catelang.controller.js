const db = require("../models");
const CateLang = db.catelang;
const Category = db.category;
const Menuitem = db.menuitem;
const errorController = require('./error.controller');
const tracerController = require('./tracer.controller');

// Ajax Lay noi dung 1 ngon ngu cua Catgory
exports.findOne = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.query.id || req.body.id || req.params.id || "";
        CateLang.findOne({
            where: {
                id
            }
        }).then(data => {
            if (data != null) {
                res.json({ code: 1, data });
            } else {
                res.json({ code: 0, message: "CateLang not exist" });
            }
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Ajax Them noi dung 1 ngon ngu cua Catgory
exports.AddCateLang = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var offadslang = req.body.offadslang;
        offadslang = (offadslang == 'on') ? true : false;
        var seotitle = req.body.seotitle;
        seotitle = (seotitle === "" || seotitle === null || seotitle === undefined) ? req.body.title : seotitle;
        var seodescription = req.body.seodescription;
        seodescription = (seodescription === "" || seodescription === null || seodescription === undefined) ? req.body.description : seodescription;
        var cateid = req.body.cateid;
        cateid = (cateid == "" || cateid == undefined) ? null : cateid;
        var langid = req.body.langid;
        langid = (langid == "" || langid == undefined) ? null : langid;
        const catelang = await CateLang.create({
            langid: langid,
            cateid: cateid,
            title: req.body.title,
            description: req.body.description,
            seotitle: seotitle,
            seodescription: seodescription,
            offadslang: offadslang
        });
        // Neu Catgory khong hien thi het ngon ngu site ho tro, thi update menu item cua category
        const category = await Category.findOne({ where: { id: cateid }, attributes: ['id', 'islikemain'] });
        if (category && !category.islikemain) {
            var langsText = await Category.findCateLangAvailableFullText(cateid);
            await Menuitem.update({
                objectlangs: langsText
            }, {
                where: {
                    objectid: cateid,
                    type: "category"
                }
            });
        }
        if (catelang) {
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "category", cateid, "edit", `Add language ${langid}`);
            return res.json({ code: 1, message: "CateLang was created successfully", data: catelang });
        } else {
            res.json({ code: 0, message: "CateLang was created error" });
        }
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Ajax Sua noi dung 1 ngon ngu cua Category
exports.EditCateLang = async(req, res) => {
    try{
        var offadslang = req.body.offadslang;
        offadslang = (offadslang == 'on') ? true : false;
        var seotitle = req.body.seotitle;
        seotitle = (seotitle === "" || seotitle === null || seotitle === undefined) ? req.body.title : seotitle;
        var seodescription = req.body.seodescription;
        seodescription = (seodescription === "" || seodescription === null || seodescription === undefined) ? req.body.description : seodescription;
        var cateid = req.body.cateid;
        cateid = (cateid == "" || cateid == undefined) ? null : parseInt(cateid);
        var langid = req.body.langid;
        langid = (langid == "" || langid == undefined) ? null : langid;
        var id = req.body.id;
        const curCateLang = await CateLang.findOne({
            where: {
                id: id
            },
            include:{
                model: Category,
                as: 'Cate',
                attributes: ['author']
            }
        })
        // Khong ton tai ngon ngu cho category nay
        if(curCateLang==null){
            return errorController.render404Ajax(req, res);
        }
        // Check quyen Edit category hoac Author
        var category = (curCateLang.Cate) ? curCateLang.Cate : {},
            author = (category.author) ? category.author : "";
        if(req.session.userid !== author){
            if(!req.roleAction || !req.roleAction.actedit){
                return errorController.render403Ajax(req, res);
            }
        }
        CateLang.update({
            langid: langid,
            cateid: cateid,
            title: req.body.title,
            description: req.body.description,
            seotitle: seotitle,
            seodescription: seodescription,
            offadslang: offadslang
        }, {
            where: {
                id
            }
        }).then(async () => {
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "category", cateid, "edit", `Edit language ${langid}`);
            res.json({ code: 1, message: "CateLang was updated successfully" });
        }).catch(() => {
            res.json({ code: 0, message: "CateLang was updated error" });
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
};
// Ajax Xoa noi dung 1 ngon ngu cua Category
exports.DeleteCateLang = async(req, res) => {
    try{
        var id = req.body.id || req.params.id || req.query.id || "";
        const curCateLang = await CateLang.findOne({
            where: { id: id },
            include: {
                model: Category,
                as: "Cate",
                attributes: ['id', 'islikemain']
            }
        });
        // Khong co phien ban ngon ngu cua Category
        if(curCateLang==null){
            return errorController.render404Ajax(req, res);
        }
        // Check quyen Del Category hoac Author
        var category = (curCateLang.Cate) ? curCateLang.Cate : {},
            author = (category.author) ? category.author : "";
        if(req.session.userid !== author){
            if(!req.roleAction || !req.roleAction.actdel){
                return errorController.render403Ajax(req, res);
            }
        }
        var deleteCateLang = await CateLang.destroy({
            where: {
                id
            }
        });
        if (deleteCateLang) {
            // Cap nhat menu item cho category neu no khong ho tro het tat ca ngon ngu trong site
            if (curCateLang && curCateLang.Cate && !curCateLang.Cate.islikemain) {
                var langsText = await Category.findCateLangAvailableFullText(curCateLang.Cate.id);
                await Menuitem.update({
                    objectlangs: langsText
                }, {
                    where: {
                        objectid: curCateLang.Cate.id,
                        type: "category"
                    }
                });
            }
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "category", curCateLang.cateid, "edit", `Delete language ${curCateLang.langid}`);
            res.json({ code: 1, message: "CateLang was deleted successfully"});
        } else {
            res.json({ code: 0, message: "CateLang was deleted error"});
        }
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}