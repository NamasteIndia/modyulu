const db = require("../models");
const Op = db.Sequelize.Op;
const ApkChoice = db.apkchoice;
const Language = db.language;
const Post = db.post;
const PostLang = db.postlang;
const errorController = require("./error.controller");

//Hien thi trang list ads
exports.ListApkChoices = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        var mainLang = (req.mainLang) ? req.mainLang : {};
        var langid = req.query.langid || mainLang.id || "pt";
        var ac = await ApkChoice.findOne({where: {langid: langid}, attributes:['pids', 'langid']});
        var posts = [];
        if(ac){
            var arrIds = ac.pids.split(",");
            posts = await Post.findAll({
                where: {
                    id: {
                        [Op.in]: arrIds
                    }
                },
                attributes: ['id', 'title'],
                raw: true
            });
        }
        var apks = functions.sort_apkchoice(posts, arrIds);
        var langs = (req.languages) ? req.languages : [];
        res.render("admin/apkchoice", {posts: apks, langs: langs, curlang: langid});
    }catch(err){
        return errorController.render500(req, res);
    }    
}

//Ajax Save Apk choices
exports.Save = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var ids = req.body.ids || "";
        var langid = req.body.langid || "pt";
        if(ids == ""){
            return res.json({code:0, message: "Please choose APKs befor"});
        }
        var choice = await ApkChoice.findOne({
            where:{
                langid: langid
            }
        });
        if(choice){
            choice.pids = ids.join(",");
            choice.save();
        }else{
            ApkChoice.create({
                pids: ids.join(","),
                langid: langid
            });
        }        
        return res.json({code:0, message: "Successfully", data: ids});
    }catch(err){
        return errorController.render500Ajax(req, res);
    }    
}

// Ajax lấy post cho menu item
exports.AjaxPosts = async(req, res) =>{
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return [];
        }    
        var searchText = req.query.term || req.query.q || "%",
            langid = req.query.langid || "es";
            results = [];
        var curLang = await Language.findOne({
            where:{
                id: langid
            }
        })
        curLang = (curLang) ? curLang : {};
        var results = [];        
        if (curLang.ismain == true) {
            results = await Post.findAll({                
                where: {
                    title: {
                        [Op.like]: `${searchText}%`
                    },
                    poststatus: "published",
                    posttype: "post-apk"
                },
                attributes:['id', 'title'],
                order:[["title", "ASC"]],
                limit: 15
            });
        } else {
            results = await Post.findAll({
                include:[{
                    model: PostLang,
                    as: "PostLang",
                    where: {
                        langid: langid
                    },
                    attributes: ['title'],
                    required: false
                }],
                where: {
                    title: {
                        [Op.like]: `${searchText}%`
                    },
                    poststatus: "published",
                    posttype: "post-apk",
                    [Op.or]: {
                        islikemain: true,
                        [Op.and]: {
                            islikemain: false,
                            '$PostLang.langid$': langid,
                        }
                    }
                },
                attributes:['id', 'title'],
                order:[["title", "ASC"]],
                limit: 15,
                subQuery: false
            });
        }
        results = (results==null) ? [] : results;
        return res.json(results);
    }catch(err){
        console.log(err)
        return [];
    }
}