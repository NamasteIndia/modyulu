const db = require("../models");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Feedback = db.feedback;
const errorController = require("./error.controller");
var multer  = require('multer');
const fs = require("fs");
const config = require('config');
var mediaconf = config.get('media');

// Hien thi trang quan tri Feedback trong admin
exports.showPage = (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        res.render("admin/feedback");
    }catch(err){
        return errorController.render500(req, res);
    }
};
// Ajax add feedback tu FontEnd
exports.Add = async(req, res) => {
    try {
        var valid = [];
        var name = (req.body.name) ? functions.encode_specials_char(req.body.name) : "",
            email = (req.body.email) ? functions.encode_specials_char(req.body.email) : "",
            link = (req.body.link) ? functions.encode_specials_char(req.body.link) : "",
            subject = (req.body.subject) ? functions.encode_specials_char(req.body.subject) : "",
            content = (req.body.content) ? functions.encode_specials_char(req.body.content) : "",
            ipaddress = req.ipAddr || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            token = req.session.ajaxpagetoken || "token",
            token2 = req.body.token || "token2",
            newToken = functions.shuffle();
        req.session.ajaxpagetoken = newToken;
        /* if (token != token2) {
            res.status(401).json({ code: 0, message: "Unauthorized" });
            return;
        } */
        var btnLoginHtml = `<div class="text-center"><a class="btn btnInLine" href="/login" rel="nofollow">${res.__("textLogin")}<a></div>`;
        if(!req.session.userid){
            return res.json({ code: 401, message: res.__("textRequireLogin"), button: btnLoginHtml });
        }
        if (name == "")
            valid.push({ id: "name", error: "This field cannot be empty" });
        if (email == "")
            valid.push({ id: "email", error: "This field cannot be empty" });
        if (link == "")
            valid.push({ id: "link", error: "This field cannot be empty" });
        if (subject == "")
            valid.push({ id: "subject", error: "This field cannot be empty" });
        if (content == "")
            valid.push({ id: "content", error: "This field cannot be empty" });
        if (valid.length > 0) {
            return res.json({ code: 0, message: "Error", data: valid });
        }
        await Feedback.create({
            name: name,
            email: email,
            link: link,
            subject: subject,
            content: content,
            ipaddress: ipaddress,
            useragent: req.get('User-Agent') || ""
        }).then(() => {
            res.json({ code: 1, message: "Thanks for your message. We will feedback to you as soon as possible", token: newToken });
        }).catch(() => {
            res.json({ code: 0, message: "Error", token: newToken });
        })
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}

var curDate = new Date();
var folder = `./uploads/feedback/${curDate.getFullYear()}/${curDate.getMonth() + 1}`;
var foldercheck = `uploads/feedback/${curDate.getFullYear()}/${curDate.getMonth() + 1}`;
var storage = multer.diskStorage({
    destination: (req, file, cb) => {        
        fs.mkdirSync(foldercheck, { recursive: true });        
        cb(null, folder);
    },
    filename: (req, file, cb) => {        
        var objoname = functions.ext_from_name(file.originalname),
            fileslug = functions.convert_slug(objoname.name),
            extension = objoname.ext,
            filename = `${fileslug}-${new Date().getTime()}.${extension}`;            
        cb(null, filename);
    }
})
var uploadSingle = multer({
    storage: storage,
    fileSize: 1024 * 1024 * 10, //Mb
    fileFilter: (req, file, cb) => {
        var arrMimetype = mediaconf.filetypes;        
        if (!arrMimetype.includes(file.mimetype)) {
            cb(new multer.MulterError('Not support'));
        } else {
            cb(null, true);
        }
    }
}).single('file')
// Ajax add feedback tu FontEnd có upload ảnh
exports.AddWithImage = async(req, res) => {
    try {
        uploadSingle(req, res, function(err) {
            if (err) {
                return res.json({ code: 0, message: res.__("textSendFeedbackFileError") });
            }
            var image = (req.file && req.file.path) ? req.file.path : "";
            var valid = [];
            var title = (req.body.title) ? functions.encode_specials_char(req.body.title) : "",
                email = (req.body.email) ? functions.encode_specials_char(req.body.email) : "",
                content = (req.body.content) ? functions.encode_specials_char(req.body.content) : "",
                ipaddress = req.ipAddr || req.headers['x-forwarded-for'] || req.connection.remoteAddress;            
            if (title == "")
                valid.push({ id: "title", error: "This field cannot be empty" });
            if (email == "")
                valid.push({ id: "email", error: "This field cannot be empty" });
            if (content == "")
                valid.push({ id: "content", error: "This field cannot be empty" });
            if (valid.length > 0) {
                return res.json({ code: 0, message: "Error", data: valid });
            }
            Feedback.create({
                name: email,
                email: email,
                link: title,
                subject: title,
                content: content,
                image: image,
                ipaddress: ipaddress,
                useragent: req.get('User-Agent') || ""
            }).then(() => {
                res.json({ code: 1, message: res.__("textSendFeedbackSuccess")});
            }).catch(() => {
                res.json({ code: 0, message: res.__("textSendFeedbackError")});
            })
        });        
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// Thuc hien bulk action
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
// Thay doi trang thai Feedback
exports.UpdateToggleColumn = async(req, res) => {
    try {
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.body.id,
            value = req.body.value;
        value = (value) ? "finished" : "pending";
        var rsUpdate = await Feedback.update({ fbstatus: value }, { where: { id: id } });
        if (rsUpdate) {
            res.json({ code: 1, message: "Record was updated successfully" });
        } else {
            res.json({ code: 0, message: "Record was updated error" });
        }
    } catch (err) {
        res.json({ code: 0, message: "Error" });
    }
}
// implement delete Feedback
exports.Delete = async(req, res) => {
    try {
        if(!req.roleAction || !req.roleAction.actdel){
            return errorController.render403Ajax(req, res);
        }
        var id = req.params.id || req.body.id,
            rsDestroy = await Feedback.destroy({
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
// load data for datatable
exports.Datatable = async(req, res) => {
    try {
        var where = {},
            search = req.query.columns[1].search.value,
            status = req.query.columns[2].search.value || "%",
            offset = Number(req.query.start) || 0,
            length = Number(req.query.length) || 10,
            sortColumn = "id",
            sortType = req.query.order[0].dir;
        sortColumn = (req.query.order[0].column == 2) ? "name" : sortColumn;
        sortColumn = (req.query.order[0].column == 3) ? "subject" : sortColumn;
        sortColumn = (req.query.order[0].column == 4) ? "content" : sortColumn;
        sortColumn = (req.query.order[0].column == 5) ? "createdAt" : sortColumn;
        if (search) {
            where = {
                [Op.or]: [{
                    name: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    email: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    link: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    subject: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    content: {
                        [Op.like]: `%${search}%`
                    }
                }]
            }
        }
        if (status != "%") {
            where.fbstatus = status;
        }
        var roleAction = (req.roleAction) ? req.roleAction : {};
        const fbs = await Feedback.findAndCountAll({
            where: where,
            order: [
                [sortColumn, sortType]
            ],
            attributes: {
                include:[
                    [sequelize.literal(`${(roleAction.actview)?roleAction.actview:0}`), 'roleview'],
                    [sequelize.literal(`${(roleAction.actadd)?roleAction.actadd:0}`), 'roleadd'],
                    [sequelize.literal(`${(roleAction.actedit)?roleAction.actedit:0}`), 'roleedit'],
                    [sequelize.literal(`${(roleAction.actdel)?roleAction.actdel:0}`), 'roledel'],
                    [sequelize.literal(`${req.session.userid}`), 'mine'],
                ]
            },
            offset: offset,
            limit: length
        });
        res.json({ aaData: fbs.rows, iTotalDisplayRecords: fbs.count, iTotalRecords: fbs.count });
    } catch (err) {
        res.json({ code: 0, message: "Error" });
    }
}