const config = require('config');
const serverConf = config.get("server");
const mailCfJson = config.get("mailserver");
const mailCf = mailCfJson.zoho;
const fromEmail = mailCfJson.email;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");
const authToken = db.auth;
const Op = db.Sequelize.Op;
const User = db.user;
const Post = db.post;
const Category = db.category;
const Tracer = db.tracer;
const errorController = require("./error.controller");
const breadcumbController = require("./breadcumb.controller");
const postController = require("./post.controller");
const menuController = require("./menu.controller");
const nodemailer = require("nodemailer");
const schema = require('./seo.schema.controller');
const seometa = require('./seo.meta.controller');
const commentController = require('./comment.controller');
const expiresIn = 60 * 60 * 24 * 365;

var xssFilters = require('xss-filters');

// Xử lý link verify account
exports.verifyAccount = async(req, res) =>{
    try{
        var code = req.query.code || "";
        var user = await User.findOne({
            where:{
                activecode: code,
                isactive: false
            }
        })
        if(user == null){
            return errorController.render404(req, res);
        }
        user.isactive = true;
        user.save();
        var token = jwt.sign({ id: user.id }, serverConf.secret, {
            expiresIn: expiresIn
        });        
        res.cookie('token', token, { maxAge: expiresIn, httpOnly: true });
        await authToken.create({
            token: token,
            username: user.username
        });
        var url = "/account/profile";
        url = (req.curLang.ismain) ? url : `/${req.curLang.id}${url}`;
        return res.redirect(url);
    }catch(err){
        return errorController.render500(req, res);
    }
}

// Trang profile
exports.showProfile = async(req, res) => {
    try {
        var curUrl = req.originalUrl;
        var slug = curUrl.match(/\/\w*-*\w*$/g);
        slug = (slug.length > 0) ? slug[0].replace(/^\//g,"") : "";
        var curLang = req.curLang;
        var pageContent = await postController.getPostByLangSlugPosttype2(slug, curLang, "post-page");
        if(pageContent==null){
            return errorController.render404(req, res);
        }
        pageContent = (!curLang.ismain) ? functions.postMaping(pageContent) : pageContent;        
        var curUrlNoneLang = curUrl.replace(`/${curLang.id}`, "");
        var menuHeader = await menuController.getMenuFontEnd(curLang, 'menu-header', "post", pageContent.id, curUrlNoneLang);
        var menuFooter = await menuController.getMenuFontEnd(curLang, 'menu-footer', "post", pageContent.id, curUrlNoneLang);
        // SEO Meta tags
        var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
        var seoTitle = (pageContent.seotitle == "") ? pageContent.title : pageContent.seotitle;
        var seoDescription = (pageContent.seodescription == "") ? pageContent.description : pageContent.seodescription;
        var homePage = await postController.getPostByLangAndSlugAttr("home", curLang);
        homePage = (!curLang.ismain) ? functions.postMaping(homePage) : homePage;
        var seoDescriptionHome = (homePage.seodescription == "") ? homePage.description : homePage.seodescription;
        var pageSeoObject = {
            pagetype: "website",
            seotitle: seoTitle,
            seodescription: seoDescription,
            index: pageContent.allowindex || false,
            follow: pageContent.allowfollow || false,
            author: pageContent.author || "0",
            name: pageContent.title,
            publishat: functions.formart_datetime(pageContent.publishedat, "seo"),
            modifyat: functions.formart_datetime(pageContent.modifiedat, "seo")
        }
        var metaPost = [];
        metaPost = await seometa.baseMeta(curLang, curUrl, pageSeoObject, arrLangsExists);
        // SEO schema structure
        var arrSchema = [];
        arrSchema.push(await schema.Organization(curLang, req.languages, homePage));
        arrSchema.push(await schema.WebSite(curLang, seoDescriptionHome));
        var thumb = pageContent.thumb || null;
        if(thumb!=null){
            arrSchema.push(await schema.ImageObject(curLang, curUrl, thumb));
        }
        arrSchema.push(await schema.WebPage("page", curLang, curUrl, pageSeoObject));

        var breadcrumbs = await breadcumbController.createBreadcumb(null, curLang, pageContent.title, curUrl);
        if (breadcrumbs && breadcrumbs.schema) {
            arrSchema.push(breadcrumbs.schema);
        }
        var user = await User.findOne({
            where:{
                id: req.session.userid || ""
            }
        })
        if(user==null){
            return errorController.render403(req, res);
        }
        var page = {
            curLang: curLang,
            seoMeta: metaPost.join(""),
            seoSchema: arrSchema.join(","),
            pageContent: pageContent,
            breadcrumbs: breadcrumbs,
            menuHeader: menuHeader,
            menuFooter: menuFooter,
            profileUser: user
        }
        var renderText = `web/${pageContent.slug}`;
        return res.render(renderText, { page: page });
    } catch (err) {
        console.log(err)
        return errorController.render500(req, res);
    }
}

// Trang profile
exports.doProfile = async(req, res) => {
    try {
        var id = req.session.userid || "";
        var user = await User.findOne({
            where:{
                id: id
            }
        });
        if(user == null){
            return errorController.render404Ajax(req, res);
        }        
        var nickname = xssFilters.inHTMLData(req.body.nickname) || "";
        user.nickname = nickname;
        user.bdd = (req.body.bdd) ? xssFilters.inHTMLData(`${req.body.bdd}`) : "";
        user.bdm = (req.body.bdm) ? xssFilters.inHTMLData(`${req.body.bdm}`) : "";
        user.bdy = (req.body.bdy) ? xssFilters.inHTMLData(`${req.body.bdy}`) : "";
        user.gender = req.body.gender || "";
        user.save();
        return res.json({code: 1, message: res.__('frmProfileSuccess')});
    } catch (err) {
        console.log(err)
        return errorController.render500Ajax(req, res);
    }
}

// Trang change pass
exports.showChangePassword = async(req, res) => {
    try {
        var curUrl = req.originalUrl;
        var slug = curUrl.match(/\/\w*-*\w*$/g);
        slug = (slug.length > 0) ? slug[0].replace(/^\//g,"") : "";
        var curLang = req.curLang;
        var pageContent = await postController.getPostByLangSlugPosttype2(slug, curLang, "post-page");
        if(pageContent==null){
            return errorController.render404(req, res);
        }
        pageContent = (!curLang.ismain) ? functions.postMaping(pageContent) : pageContent;        
        var curUrlNoneLang = curUrl.replace(`/${curLang.id}`, "");
        var menuHeader = await menuController.getMenuFontEnd(curLang, 'menu-header', "post", pageContent.id, curUrlNoneLang);
        var menuFooter = await menuController.getMenuFontEnd(curLang, 'menu-footer', "post", pageContent.id, curUrlNoneLang);
        // SEO Meta tags
        var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
        var seoTitle = (pageContent.seotitle == "") ? pageContent.title : pageContent.seotitle;
        var seoDescription = (pageContent.seodescription == "") ? pageContent.description : pageContent.seodescription;
        var homePage = await postController.getPostByLangAndSlugAttr("home", curLang);
        homePage = (!curLang.ismain) ? functions.postMaping(homePage) : homePage;
        var seoDescriptionHome = (homePage.seodescription == "") ? homePage.description : homePage.seodescription;
        var pageSeoObject = {
            pagetype: "website",
            seotitle: seoTitle,
            seodescription: seoDescription,
            index: pageContent.allowindex || false,
            follow: pageContent.allowfollow || false,
            author: pageContent.author || "0",
            name: pageContent.title,
            publishat: functions.formart_datetime(pageContent.publishedat, "seo"),
            modifyat: functions.formart_datetime(pageContent.modifiedat, "seo")
        }
        var metaPost = [];
        metaPost = await seometa.baseMeta(curLang, curUrl, pageSeoObject, arrLangsExists);
        // SEO schema structure
        var arrSchema = [];
        arrSchema.push(await schema.Organization(curLang, req.languages, homePage));
        arrSchema.push(await schema.WebSite(curLang, seoDescriptionHome));
        var thumb = pageContent.thumb || null;
        if(thumb!=null){
            arrSchema.push(await schema.ImageObject(curLang, curUrl, thumb));
        }
        arrSchema.push(await schema.WebPage("page", curLang, curUrl, pageSeoObject));

        var breadcrumbs = await breadcumbController.createBreadcumb(null, curLang, pageContent.title, curUrl);
        if (breadcrumbs && breadcrumbs.schema) {
            arrSchema.push(breadcrumbs.schema);
        }
        var page = {
            curLang: curLang,
            seoMeta: metaPost.join(""),
            seoSchema: arrSchema.join(","),
            pageContent: pageContent,
            breadcrumbs: breadcrumbs,
            menuHeader: menuHeader,
            menuFooter: menuFooter
        }
        var renderText = `web/${pageContent.slug}`;
        res.render(renderText, { page: page });
    } catch (err) {
        return errorController.render500(req, res);
    }
}

// Trang change pass
exports.doChangePassword = async(req, res) => {
    try {
        var id = req.session.userid || "";
        var user = await User.findOne({
            where:{
                id: id
            }
        });
        if(user == null){
            return errorController.render404Ajax(req, res);
        }        
        var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );
        if (!passwordIsValid) {
            return res.json({code: 0, message: res.__('frmLoginMsgWrongPassword')});
        }
        passwordIsValid = bcrypt.compareSync(
            req.body.npassword,
            user.password
        );
        if(passwordIsValid){
            return res.json({code: 0, message: res.__('frmChangePassNone')});
        }
        var npassword = req.body.npassword || "";
        npassword = bcrypt.hashSync(npassword, 8);        
        user.password = npassword;
        user.save();
        return res.json({code: 1, message: res.__('frmRecoverySuccess')});
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}

// Trang profile comment
exports.showDiscuss = async(req, res) => {
    try {
        var curUrl = req.originalUrl;
        var slug = curUrl.match(/\/\w*-*\w*$/g);
        slug = (slug.length > 0) ? slug[0].replace(/^\//g,"") : "";
        var curLang = req.curLang;
        var pageContent = await postController.getPostByLangSlugPosttype2(slug, curLang, "post-page");
        if(pageContent==null){
            return errorController.render404(req, res);
        }
        pageContent = (!curLang.ismain) ? functions.postMaping(pageContent) : pageContent;        
        var curUrlNoneLang = curUrl.replace(`/${curLang.id}`, "");
        var menuHeader = await menuController.getMenuFontEnd(curLang, 'menu-header', "post", pageContent.id, curUrlNoneLang);
        var menuFooter = await menuController.getMenuFontEnd(curLang, 'menu-footer', "post", pageContent.id, curUrlNoneLang);
        // SEO Meta tags
        var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
        var seoTitle = (pageContent.seotitle == "") ? pageContent.title : pageContent.seotitle;
        var seoDescription = (pageContent.seodescription == "") ? pageContent.description : pageContent.seodescription;
        var homePage = await postController.getPostByLangAndSlugAttr("home", curLang);
        homePage = (!curLang.ismain) ? functions.postMaping(homePage) : homePage;
        var seoDescriptionHome = (homePage.seodescription == "") ? homePage.description : homePage.seodescription;
        var pageSeoObject = {
            pagetype: "website",
            seotitle: seoTitle,
            seodescription: seoDescription,
            index: pageContent.allowindex || false,
            follow: pageContent.allowfollow || false,
            author: pageContent.author || "0",
            name: pageContent.title,
            publishat: functions.formart_datetime(pageContent.publishedat, "seo"),
            modifyat: functions.formart_datetime(pageContent.modifiedat, "seo")
        }
        var metaPost = [];
        metaPost = await seometa.baseMeta(curLang, curUrl, pageSeoObject, arrLangsExists);
        // SEO schema structure
        var arrSchema = [];
        arrSchema.push(await schema.Organization(curLang, req.languages, homePage));
        arrSchema.push(await schema.WebSite(curLang, seoDescriptionHome));
        var thumb = pageContent.thumb || null;
        if(thumb!=null){
            arrSchema.push(await schema.ImageObject(curLang, curUrl, thumb));
        }
        arrSchema.push(await schema.WebPage("page", curLang, curUrl, pageSeoObject));
        var breadcrumbs = await breadcumbController.createBreadcumb(null, curLang, pageContent.title, curUrl);
        if (breadcrumbs && breadcrumbs.schema) {
            arrSchema.push(breadcrumbs.schema);
        }
        var userId = req.session.userid || "";
        var comments = (userId!="") ? await commentController.getListCommentByUserid(userId, 1) : [];
        var page = {
            curLang: curLang,
            seoMeta: metaPost.join(""),
            seoSchema: arrSchema.join(","),
            pageContent: pageContent,
            breadcrumbs: breadcrumbs,
            menuHeader: menuHeader,
            menuFooter: menuFooter,
            comments: comments
        }
        var renderText = `web/${pageContent.slug}`;
        res.render(renderText, { page: page });
    } catch (err) {
        return errorController.render500(req, res);
    }
}

// Trang password recovery
exports.showPassRecovery = async(req, res) => {
    try {
        var curUrl = req.originalUrl;
        var slug = curUrl.match(/\/\w*-*\w*$/g);
        slug = (slug.length > 0) ? slug[0].replace(/^\//g,"") : "";
        var curLang = req.curLang;
        var pageContent = await postController.getPostByLangSlugPosttype2(slug, curLang, "post-page");
        if(pageContent==null){
            return errorController.render404(req, res);
        }
        pageContent = (!curLang.ismain) ? functions.postMaping(pageContent) : pageContent;        
        var curUrlNoneLang = curUrl.replace(`/${curLang.id}`, "");
        var menuHeader = await menuController.getMenuFontEnd(curLang, 'menu-header', "post", pageContent.id, curUrlNoneLang);
        var menuFooter = await menuController.getMenuFontEnd(curLang, 'menu-footer', "post", pageContent.id, curUrlNoneLang);
        // SEO Meta tags
        var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
        var seoTitle = (pageContent.seotitle == "") ? pageContent.title : pageContent.seotitle;
        var seoDescription = (pageContent.seodescription == "") ? pageContent.description : pageContent.seodescription;
        var homePage = await postController.getPostByLangAndSlugAttr("home", curLang);
        homePage = (!curLang.ismain) ? functions.postMaping(homePage) : homePage;
        var seoDescriptionHome = (homePage.seodescription == "") ? homePage.description : homePage.seodescription;
        var pageSeoObject = {
            pagetype: "website",
            seotitle: seoTitle,
            seodescription: seoDescription,
            index: pageContent.allowindex || false,
            follow: pageContent.allowfollow || false,
            author: pageContent.author || "0",
            name: pageContent.title,
            publishat: functions.formart_datetime(pageContent.publishedat, "seo"),
            modifyat: functions.formart_datetime(pageContent.modifiedat, "seo")
        }
        var metaPost = [];
        metaPost = await seometa.baseMeta(curLang, curUrl, pageSeoObject, arrLangsExists);
        // SEO schema structure
        var arrSchema = [];
        arrSchema.push(await schema.Organization(curLang, req.languages, homePage));
        arrSchema.push(await schema.WebSite(curLang, seoDescriptionHome));
        var thumb = pageContent.thumb || null;
        if(thumb!=null){
            arrSchema.push(await schema.ImageObject(curLang, curUrl, thumb));
        }
        arrSchema.push(await schema.WebPage("page", curLang, curUrl, pageSeoObject));

        var breadcrumbs = await breadcumbController.createBreadcumb(null, curLang, pageContent.title, curUrl);
        if (breadcrumbs && breadcrumbs.schema) {
            arrSchema.push(breadcrumbs.schema);
        }
        var page = {
            curLang: curLang,
            seoMeta: metaPost.join(""),
            seoSchema: arrSchema.join(","),
            pageContent: pageContent,
            breadcrumbs: breadcrumbs,
            menuHeader: menuHeader,
            menuFooter: menuFooter
        }
        var renderText = `web/${pageContent.slug}`;
        res.render(renderText, { page: page });
    } catch (err) {
        return errorController.render500(req, res);
    }
}

// Trang password recovery
exports.doPassRecovery = async(req, res) => {
    try {
        var minDate = new Date();
        minDate.setMinutes(minDate.getMinutes() - 30);
        var count = await Tracer.count({
            where:{
                ip: req.ipAddr,
                object: "user",
                action: "dorecovery",
                createdAt: {
                    [Op.gte]: minDate
                }
            }
        })
        if(count >= 10){
            return res.json({ code: 0, message: res.__('mailSendCodeMsgblock') });
        }
        var email = req.body.email || "",
            password = req.body.password || "",
            captcha = req.body.captcha || "";
        password = bcrypt.hashSync(password, 8);
        var user = await User.findOne({
            where:{
                email: email
            }
        })
        await Tracer.create({
            ip: req.ipAddr,
            agent: req.userAgent,
            object: "user",
            action: "dorecovery",
            notes: "Recovery password submit"
        });
        if(user==null){
            return res.json({code:0, message: res.__('frmSendCodeMsgError')})
        }
        if(user.recoveredcode !== captcha){
            return res.json({code:0, message: res.__('frmRecoveryWrongCapcha')})
        }
        if(!user.isactive){
            return res.json({code:0, message: res.__('frmLoginMsgNotActive')})
        }
        if(user.isblock){
            return res.json({code:0, message: res.__('frmLoginMsgIsBlock')})
        }
        user.password = password;
        user.recoveredcode = "";
        user.save();        
        return res.json({code:1, message: res.__('frmRecoverySuccess')});
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}

exports.sendCodeRecovery = async(req, res) =>{
    try{        
        var minDate = new Date();
        minDate.setMinutes(minDate.getMinutes() - 30);
        var count = await Tracer.count({
            where:{
                ip: req.ipAddr,
                object: "user",
                action: "sendcode",
                createdAt: {
                    [Op.gte]: minDate
                }
            }
        })       
        if(count >= 3){
            return res.json({ code: 0, message: res.__('mailSendCodeMsgblock') });
        } 
        var email = req.body.email || "";
        var user = await User.findOne({
            where:{
                email: email
            }
        })
        if(user==null){
            return res.json({code:0, message: res.__('frmSendCodeMsgError')})
        }
        if(!user.isactive){
            return res.json({code:0, message: res.__('frmLoginMsgNotActive')})
        }
        if(user.isblock){
            return res.json({code:0, message: res.__('frmLoginMsgIsBlock')})
        }        
        var nickname = (user.nickname) ? user.nickname : user.username;
        var code = Math.floor(Math.random() * 100000000);        
        var smtpTransport = nodemailer.createTransport(mailCf);
        var mailOptions = {
            from: `${sitename} <${fromEmail}>`,
            to: email,
            subject: `${res.__('mailSendCodeRecoveryTitle')} ✔`,
            html: `<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" width="100%">
                    <tbody>
                        <tr>
                            <td align="center" style="color:#202124;font-family:Google Sans,&quot;Roboto&quot;,Arial;font-size:22px;font-weight:normal;line-height:44px;margin:0;padding:0 80px 0 80px;text-align:center;word-break:normal;direction:ltr" dir="ltr">
                                ${res.__('textHello')} ${nickname}!
                            </td>
                        </tr>               
                        <tr>
                            <td align="center" style="color:#3c4043;font-family:&quot;Roboto&quot;,OpenSans,&quot;Open Sans&quot;,Arial,sans-serif;font-size:16px;font-weight:normal;line-height:24px;margin:0;padding:0 70px 0 70px;text-align:center;word-break:normal;direction:ltr" dir="ltr">
                                ${res.__('mailRecoveryPassContent')}
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="color:#111;font-family:&quot;Roboto&quot;,OpenSans,&quot;Open Sans&quot;,Arial,sans-serif;font-size:16px;font-weight:normal;line-height:35px;margin:0;padding:0 80px 0 80px;text-align:center;word-break:normal;direction:ltr" dir="ltr">
                                <strong>${code}</strong>
                            </td>
                        </tr>
                    </tbody>
                </table>`
        }
        await Tracer.create({
            ip: req.ipAddr,
            agent: req.userAgent,
            object: "user",
            action: "sendcode",
            notes: "Required to recovery password"
        });        
        smtpTransport.sendMail(mailOptions, function(error, response){
            smtpTransport.close();            
            if(error){
                return res.json({code:0, message: res.__('frmSendCodeMsgError')})
            }            
            user.recoveredcode = code;
            user.save();
            return res.json({code: 1, message: res.__('frmSendCodeMsgSuccess')})
        });        
    }catch(err){
        console.log(err)
        return res.json({code:0, message: res.__('frmSendCodeMsgError')})
    }
}

// Ajax tra ve thong tin dang nhap va link admin bar cho page cache fontend
exports.getNoneCacheUserInfo = async(req, res) => {
    try {
        if(req.session.token && req.session.username){
            var data = {},
                username = req.session.username || "",
                curLang = (req.curLang) ? req.curLang : {},
                homeUrl = (curLang.ismain) ? `${domain}` : `${domain}/${curLang.id}`,
                user = [],
                adBar = [],
                avatar = (req.session.avatar) ? req.session.avatar : '/assets/image/none-avatar.png';
            if(req.session.username){
                user.push(`<a href="javascript:void(0)" class="dd-toggle" rel="nofollow"><img class="avatar" src="${avatar}" alt="Avatar ${username}"></a>`);
                user.push(`<div class="dd-content">`);
                user.push(`<a href="${homeUrl}/account/profile">${res.__("textProfile")}</a>`);
                user.push(`<a href="${homeUrl}/logout">${res.__("textLogout")}</a>`);
                user.push(`</div>`);
            }else{
                user.push(`<a href="javascript:void(0)" class="dd-toggle" rel="nofollow"><svg class="avatar" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 20 20"><path d="M10,0A10,10,0,1,0,20,10,10.029,10.029,0,0,0,10,0Zm0,3a2.946,2.946,0,0,1,3,3,2.946,2.946,0,0,1-3,3A2.946,2.946,0,0,1,7,6,2.946,2.946,0,0,1,10,3Zm0,14.2A7.3,7.3,0,0,1,4,14c0-2,4-3.1,6-3.1S16,12,16,14A7.3,7.3,0,0,1,10,17.2Z" fill="#fff"/></svg></a>`);
                user.push(`<div class="dd-content">`);
                user.push(`<a href="${homeUrl}/login">${res.__("textLogin")}</a>`);
                user.push(`<a href="${homeUrl}/register">${res.__("textSignUp")}</a>`);
                user.push(`</div>`);
            }            
            data.user = user.join("");
            if(req.session.role!=null){
                var ptype = req.query.ptype || req.body.ptype || "";
                var pid = req.query.pid || req.body.ptype || "";
                adBar.push(`<a class="btn-brfixed fn-addpost" href="/${dashboard}/post/post-apk/add">+</a>`);
                if(ptype=="p"){
                    var post = await Post.findOne({
                        where:{
                            id: pid
                        },
                        attributes: ['id', 'slug', 'posttype']
                    });
                    if(post!=null){
                        adBar.push(`<a class="btn-brfixed fn-editpost" href="/${dashboard}/post/${post.posttype}/edit/${post.id}">✎</a>`);
                    }
                }
                if(ptype=="c"){
                    var cate = await Category.findOne({
                        where:{
                            id: pid
                        },
                        attributes: ['id', 'slug', 'catetype']
                    });
                    if(cate!=null){
                        adBar.push(`<a class="btn-brfixed fn-editpost" href="/${dashboard}/category/${cate.catetype}/edit/${cate.id}">✎</a>`);
                    }
                }                
            }
            var userCmtNotif = 0;            
            if(req.session.userid) userCmtNotif = await commentController.countNotificationComment(req.session.userid);
            if(userCmtNotif > 0) adBar.push(`<a class="btn-brfixed fn-bell-notification" href="/account/comment"><span class="relative"><i class="tb-icon icon-bell"></i><span>${userCmtNotif}</span></span></a>`);
            data.adbar = adBar.join("");
            return res.json({code: 1, message: "Welcome to Techbigs.com", html: data});
        }
        return res.json({code:0, message: "Please login"});
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
