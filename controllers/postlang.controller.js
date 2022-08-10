const db = require("../models");
const PostLang = db.postlang;
const Post = db.post;
const Language = db.language;
const Type = db.type;
const Menuitem = db.menuitem;
const Apkfaq = db.apkfaq;
const errorController = require('./error.controller');
const tracerController = require('./tracer.controller');

// Hien thi trang them phien ban ngon ngu cho Post
exports.GetAddPostLang = async(req, res) => {
    try{
        // Check quyen Add Post
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403(req, res);
        }
        var postid = req.params.postid || "",
            langid = req.params.langid || "";        
        // Lay noi dung post
        const post = await Post.findOne({
            where: {
                id: postid
            },
            attributes: ['id', 'title', 'slug', 'description', 'content', 'seotitle', 'seodescription', 'posttype']
        });
        // Post khong ton tai
        if(post==null){
            return errorController.render404(req, res);
        }
        // Lay noi dung loai post
        const type = await Type.findOne({
            where: {
                id: post.posttype
            },
            include: {
                model: Type,
                as: 'posttype',
                attributes: ['id', 'name'],
                through: {
                    attributes: []
                }
            }
        });
        // Loai post khong ton tai
        if(type==null){
            return errorController.render404(req, res);
        }
        const language = await Language.findOne({ 
            where: { 
                id: langid
            }
        });     
        return res.render("admin/postlang-add", { type, language, post });
    }catch(err){
        return errorController.render500(req, res);
    }
}
// Hien thi trang sua phien ban ngon ngu cho Post
exports.GetEditPostLang = async(req, res) => {
    try{        
        var postid = req.params.postid || "",
            langid = req.params.langid || "";
        const postlang = await PostLang.findOne({ where: { postid: postid, langid: langid } });        
        // Khong ton tai phien ban ngon ngu cho Post nay
        if(postlang==null){
            return errorController.render404(req, res);
        }
        // Lay noi dung post
        /* const post = await Post.findOne({
            where: {
                id: postid
            },
            attributes: ['id', 'title', 'slug', 'description', 'content', 'seotitle', 'seodescription', 'posttype', 'author']
        });  */  
        const post = await Post.findOne({
            where: {
                id: postid
            },
            attributes: ['id', 'title', 'slug', 'description', 'content', 'seotitle', 'seodescription', 'posttype', 'author'],
            include: [{
                model: Apkfaq,
                as: 'faq',
                where: {
                    langid: langid
                },
                required: false
            }],
            order: [  
                [{model: Apkfaq, as:"faq"}, 'numsort', 'DESC']
            ]
        });     
        // Post khong ton tai
        if(post==null){
            return errorController.render404(req, res);
        }
        // Check quyen Edit post hoac Author
        if(post.author !== req.session.userid){            
            if(!req.roleAction || !req.roleAction.actedit){
                return errorController.render403(req, res);
            }
        }
        // Lay noi dung loai post
        const type = await Type.findOne({
            where: {
                id: post.posttype
            },
            include: {
                model: Type,
                as: 'posttype',
                attributes: ['id', 'name'],
                through: {
                    attributes: []
                }
            }
        });        
        // Loai post khong ton tai
        if(type==null){
            return errorController.render404(req, res);
        }
        const language = await Language.findOne({ 
            where: { 
                id: langid
            }
        });
        res.render("admin/postlang-edit", { type, language, post, postlang });
    }catch(err){
        return errorController.render500(req, res);
    }
}
// Submit form them ngon ngu cho post
exports.AddPostLang = async(req, res) => {
    try{
        // Check quyen Add Post
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var offadslang = req.body.offadslang;
        offadslang = (offadslang == 'on') ? true : false;
		var offadsdownload = req.body.offadsdownload;
        offadsdownload = (offadsdownload == 'on') ? true : false;
        var seotitle = req.body.seotitle;
        seotitle = (seotitle === "" || seotitle === null || seotitle === undefined) ? req.body.title : seotitle;
        var seodescription = req.body.seodescription;
        seodescription = (seodescription === "" || seodescription === null || seodescription === undefined) ? req.body.description : seodescription;
        var postid = req.body.postid;
        postid = (postid == "" || postid == undefined) ? null : parseInt(postid);
        var langid = req.body.langid;
        langid = (langid == "" || langid == undefined) ? null : langid;
        // Lay noi dung post
        const post = await Post.findOne({
            where: {
                id: postid
            },
            attributes: ['id', 'title', 'slug', 'description', 'content', 'seotitle', 'seodescription', 'posttype']
        });
        // Post khong ton tai
        if(post==null){
            return errorController.render404(req, res);
        }
        // Thuc hien them phien ban ngon ngu cho Post
        const postlang = await PostLang.create({
            langid: langid,
            postid: postid,
            title: req.body.title,
            content: req.body.content,
            description: req.body.description,
            seotitle: seotitle,
            seodescription: seodescription,
            offadslang: offadslang,
			offadsdownload: offadsdownload
        });
        // Update menu item neu Post la 1 item menu
        if (postlang && !postlang.islikemain) {
            var langsText = await Post.findPostLangAvailableFullText(postid);
            await Menuitem.update({
                objectlangs: langsText
            }, {
                where: {
                    objectid: postid,
                    type: "post"
                }
            });
        }
        if (postlang) {
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", postid, "edit", `Add language ${langid}`);
            var redirect = `${domain}/${dashboard}/post/${post.posttype}/lang/edit/${postid}/${langid}`;
            return res.json({ code: 1, message: "PostLang was created successfully!", redirect: redirect });
        } else {
            return res.json({ code: 0, message: "PostLang was created error" });
        }
    }catch(err){     
        return errorController.render500Ajax(req, res);
    }
}
// Submit form sua ngon ngu cho post
exports.EditPostLang = async(req, res) => {
    try{        
        var offadslang = req.body.offadslang;
        offadslang = (offadslang == 'on') ? true : false;
		var offadsdownload = req.body.offadsdownload;
        offadsdownload = (offadsdownload == 'on') ? true : false;
        var seotitle = req.body.seotitle;
        seotitle = (seotitle === "" || seotitle === null || seotitle === undefined) ? req.body.title : seotitle;
        var seodescription = req.body.seodescription;
        seodescription = (seodescription === "" || seodescription === null || seodescription === undefined) ? req.body.description : seodescription;
        var id = req.body.id || "";
        var postid = req.body.pid || "";
        // Lay noi dung post
        const post = await Post.findOne({
            where: {
                id: postid
            },
            attributes: ['id', 'title', 'slug', 'description', 'content', 'seotitle', 'seodescription', 'posttype', 'author'] 
        });
        // Post khong ton tai
        if(post==null){
            return errorController.render404(req, res);
        }
        // Check quyen Edit Post hoac Author
        if(post.author !== req.session.userid){
            if(!req.roleAction || !req.roleAction.actedit){
                return errorController.render403Ajax(req, res);
            }
        }
        var postlang = await PostLang.findOne({
            where:{
                id
            }
        })
        if(postlang == null){
            return errorController.render404Ajax(req, res);
        }
        postlang.title = req.body.title || "";
        postlang.description = req.body.description || "";
        postlang.content = req.body.content || "";
        postlang.seotitle = seotitle || "";
        postlang.seodescription = seodescription || "";
        postlang.offadslang = offadslang;
        postlang.offadsdownload = offadsdownload;
        postlang.save();
        await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", post.id, "edit", `Edit language ${postlang.langid}`);
        return res.json({ code: 1, message: "PostLang was updated success" });

        PostLang.update({
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            seotitle: seotitle,
            seodescription: seodescription,
            offadslang: offadslang
        }, {
            where: {
                id
            }
        }).then(async () => {
            
        }).catch(error => {
            res.json({ code: 0, message: "PostLang was updated error" });
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Delete phien ban ngon ngu cua post
exports.DeletePostLang = async(req, res) => {
    try{
        var postid = req.params.postid || "",
            langid = req.params.langid || "";
        // Lay noi dung post
        const post = await Post.findOne({
            where: {
                id: postid
            },
            attributes: ['id', 'islikemain', 'posttype', 'author']
        });
        // Check quyen Del Post
        if(post.author !== req.session.userid){
            if(!req.roleAction || !req.roleAction.actdel){
                return errorController.render403Ajax(req, res);
            }
        }
        var deletePostLang = await PostLang.destroy({
            where: {
                postid: postid,
                langid: langid
            }
        });
        if (deletePostLang) {
            if (post && !post.islikemain) {
                var langsText = await Post.findPostLangAvailableFullText(post.id);
                await Menuitem.update({
                    objectlangs: langsText
                }, {
                    where: {
                        objectid: post.id,
                        type: "post"
                    }
                });
            }
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", postid, "edit", `Delete language ${langid}`);
            res.json({ code: 1, message: "PostLang was deleted successfully" });
        } else {
            res.json({ code: 0, message: error.message });
        };
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}