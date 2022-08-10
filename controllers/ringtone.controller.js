const db = require("../models");
const multer = require('multer');
const fs = require("fs");
const config = require('config');
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Type = db.type;
const Post = db.post;
const Ringtone = db.ringtone;
const User = db.user;
const errorController = require("./error.controller");
var ringtoneconf = config.get('ringtone');
var curDate = new Date();
var folderRingstone = './ringtones/'.concat(curDate.getFullYear(), '/', curDate.getMonth() + 1);


// Kiem tra ten file va thu muc chua file co ton tai khong
var storageRingstone = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdirSync(folderRingstone, { recursive: true });
        cb(null, folderRingstone);
    },
    filename: (req, file, cb) => {
        var objoname = functions.ext_from_name(file.originalname),
            fileslug = functions.convert_slug(objoname.name),
            extension = objoname.ext,
            filename = `${fileslug}.${extension}`;
        Ringtone.count({
            where: {
                filename: filename
            }
        }).then(numExists => {
            filename = (numExists > 0) ? `${fileslug}-${numExists}.${extension}` : filename;
            cb(null, filename);
        }).catch(err => {
            cb(new multer.MulterError(err.message));
        });
    }
})

// Check filetype
var uploadRingstone = multer({
    storage: storageRingstone,
    fileSize: 1024 * 1024 * ringtoneconf.filesize, // Mb
    fileFilter: (req, file, cb) => {
        var arrMimetype = ringtoneconf.filetypes;
        if (!arrMimetype.includes(file.mimetype)) {
            cb(new multer.MulterError('This file is not support'));
        } else {
            cb(null, true);
        }
    }
}).single('file')

// Upload mp3
exports.UploadRingtone = (req, res) => {
    var postid = req.params.postid;
    uploadRingstone(req, res, function(err) {
        if (err || req.file === undefined) {
            res.json({ code: 0, message: err.code });
        } else {            
            var objoname = functions.ext_from_name(req.file.originalname);
            var name = functions.slug_to_name(objoname.name);
            var destination = (req.file.destination) ? req.file.destination : "";
            destination = destination.replace(/^\./g, "");
            Ringtone.create({
                name: name,
                url: `${domain}/${req.file.destination.replace("./ringtones", "files")}/${req.file.filename}`,
                filename: req.file.filename,
                destination: destination,
                filetype: req.file.mimetype,
                filesize: functions.calc_filesize(req.file.size),
                author: (req.session.userid) ? req.session.userid : null,
                postid: postid
            }).then(ringtone => {
                res.json({ code: 1, message: "Files was uploaded successful", data: ringtone });
            }).catch(err => {
                res.json({ code: 0, message: err.message, data: req.file });
            });
        }
    });
}

// Hien thi danh sach file MP3 cua 1 Category
exports.ListRingtones = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        var postid = req.params.postid || "";
        const post = await Post.findOne({
            where: {
                id: postid
            },
            attributes: ['id', 'title', 'posttype']
        })
        if(post==null){
            return errorController.render404(req, res);
        }
        const type = await Type.findOne({
            where: {
                id: post.posttype
            }
        })
        if(type==null){
            return errorController.render404(req, res);
        }
        return res.render("admin/ringtonesmp3", { type, post });
    }catch(err){
        return errorController.render500(req, res);
    }
}

// Load thong tin MP3 len modal sua
exports.findOne = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.body.id || req.params.id;
        const data = await Ringtone.findOne({
            where: {
                id
            }
        })
        if(data==null){
            return res.json({ code: 0, message: "Ringtone not exist" });
        }
        return res.json({ code: 1, data });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Edit Mp3
exports.EditRigntone = async(req, res) => {
    try{
        var id = req.body.id || "";
        var oldRingtone = await Ringtone.findOne({
            where:{
                id:id
            }
        })
        if(oldRingtone==null){
            return errorController.render404Ajax(req, res);
        }
        // check quyen edit hoac author
        if(oldRingtone.author != req.session.userid){
            if(!req.roleAction || req.roleAction.actedit){
                return errorController.render403Ajax(req, res);
            }
        }
        oldRingtone.name = req.body.name || "";
        //oldRingtone.url = req.body.url || "";
        oldRingtone.filesize = req.body.filesize || "";
        oldRingtone.save();
        return res.json({ code: 1, message: "Ringtone was updated success" });        
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Ajax add list ringtones
exports.addRigntones = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var data = req.body.data;
        var bulkData = data.map(d => {
            var f = d;
            var objoname = functions.ext_from_name(d.name);
            var name = functions.slug_to_name(objoname.name);
            f.name = name;
            f.author = req.session.userid;
            return f;
        })
        if(bulkData.length > 0){
            var createdData = await Ringtone.bulkCreate(bulkData);
            return res.json({
                code: 1,
                message: "Ringtones was created success",
                data: createdData
            })
        }
        return res.json({ code: 0, message: "Ringtones was added error" });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Delete MP3
exports.DeleteRingtone = (req, res) => {
    try{
        var id = req.params.id || req.body.id || "",
            where = {
                id: id
            };
        if(!req.roleAction || !req.roleAction.actdel){
            where.author = req.session.userid || "";
        }
        Ringtone.destroy({
            where: where
        }).then(delCount => {
            if(delCount <= 0){
                return res.json({ code: 0, message: "Ringtone can't delete" });
            }
            return res.json({ code: 1, message: "Ringtone was deleted successfully" });
        }).catch(error => {
            return res.json({ code: 0, message: error.message });
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Bulk action MP3
exports.BulkRingtones = (req, res) => {
    try{
        var id = req.body.id;
        var action = req.body.action;
        switch (action) {
            case "delete":
                req.body.id = id;
                this.DeleteRingtone(req, res);
                break;
        }
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Phan trang MP3
exports.Datatable = async(req, res) => {
    try{
        var where = {},
            column = "id";
        var postid = req.params.postid || "";
        var search = req.query.columns[1].search.value;
        where = {
            name: {
                [Op.like]: `%${search}%`
            },
            postid: postid
        };
        var start = Number(req.query.start);
        var length = Number(req.query.length);
        if (req.query.order[0].column == 0) column = "id";
        if (req.query.order[0].column == 1) column = "name";
        if (req.query.order[0].column == 2) column = "url";
        var type = req.query.order[0].dir;
        var roleAction = (req.roleAction) ? req.roleAction : {};
        if (Number.isInteger(start) && Number.isInteger(length)) {
            var ringtones = await Ringtone.findAndCountAll({
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
                include: [{
                    model: User,
                    as: 'Author'
                }],
                order: [
                    [column, type]
                ],
                offset: start,
                limit: length
            })
            return res.json({ aaData: ringtones.rows, iTotalDisplayRecords: ringtones.count, iTotalRecords: ringtones.count });
        } else {
            res.json({ code: 0, message: "Error page" });
        }
    }catch(err){
        console.log(err)
        return errorController.render500Ajax(req, res);
    }
}