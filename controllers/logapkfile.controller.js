const request = require('request-promise');
const db = require("../models");
const LogApkFile = db.logapkfile;
const Apkmeta = db.apkmeta;
const Post = db.post;
const Postlang = db.postlang;
const LogAutoUpdateVersion = db.logupdateversion;
const config = require("config");
const { sequelize } = require('../models');
const apkleechCf = config.get("apkleech");
const reLeechFileTime = apkleechCf.getfiletime;

// Ajax lay link apk moi nhat tu google khi user xem page single
// Link duoc lay va luu vao trong table LogApkFile
// Sau [reLeechFileTime] phut hoac Cron auto update phat hien co version moi thi lay lai va luu vao LogApkFile
async function singleApkFileLoading(req, res) {
    try{
        var packageName = req.body.appid || "",
            postid = req.body.pid || 0,
            token = req.body.token || "",
            flagLeech = true,
            rsData = {code: 0, message: "Not found"};
        if(packageName == "" || postid == 0){
            res.json({code: 0, message: "Params is not valid"});
            return;
        }
        const log = await LogApkFile.findOne({where: {package_name: packageName}});
        if(log != null){            
            var readTime = functions.calc_hours_two_dates(new Date(), log.updatedAt);
            if(log.isloaded && readTime <= reLeechFileTime && log.apklink != ""){
                var data = {
                    link: log.apklink,                    
                    size: log.apksize,
                    obb: log.obblink,
                    obbsize: log.obbsize,
                    version: log.apkversion
                };
                flagLeech = false;
                rsData = {code: 1, message: "Successfully", data: data};
            }
            flagLeech = (!log.isloaded) ? true : flagLeech;
            flagLeech = (log.isnolink) ? false : flagLeech;
            flagLeech = (readTime > reLeechFileTime) ? true : flagLeech;            
        }
        if(flagLeech){            
            var leechFileOption = {
                method: 'GET',
                uri: `${apkleechCf.getfile}${packageName}`,
                json: true
            };            
            await request(leechFileOption).then(async function(rsApkFile) {
                var isnolink = (rsApkFile.ApkUrl==undefined) ? true : false,
                    isloaded = true,
                    apklink = (rsApkFile.ApkUrl) ? rsApkFile.ApkUrl : "",                    
                    apkversion = (rsApkFile.AppVersion) ? rsApkFile.AppVersion : "",
                    oldversion = "",
                    apksize = rsApkFile.ApkSize || "";
                    obblink = (rsApkFile.ObbUrl) ? rsApkFile.ObbUrl : "",
                    obbsize = rsApkFile.ObbSize || "";
                apksize = (apksize!=="") ? functions.calc_filesize(apksize) : "";
                obbsize = (obbsize!=="") ? functions.calc_filesize(obbsize) : "";
                if(log==null){                   
                    await LogApkFile.create({
                        postid: postid,
                        package_name: packageName,
                        apklink: apklink,                        
                        apksize: apksize,
                        obblink: obblink,
                        obbsize: obbsize,
                        apkversion: apkversion,
                        isloaded: isloaded,
                        isnolink: isnolink
                    });
                }else{
                    oldversion = log.apkversion || "";
                    await LogApkFile.update({
                        apklink: apklink,                        
                        apksize: apksize,
                        obblink: obblink,
                        obbsize: obbsize,
                        apkversion: apkversion,
                        isloaded: isloaded,
                        isnolink: isnolink
                    },{
                        where:{
                            id: log.id
                        }
                    });
                }
                if(oldversion != apkversion){
                    await changeVersionApk(postid, apkversion, apksize, "Khi xem trang single");
                }
                if(apklink.length > 0){
                    var data = {
                        link: apklink,                        
                        size: apksize,
                        obb: obblink,
                        obbsize: obbsize,
                        version: apkversion
                    }
                    rsData = {code: 1, message: "Successfully", data: data};
                }
            }).catch(function(err) {                
                rsData = { code: 0, message: err.message };
            });
        }
        res.json(rsData);
    }catch(err){
        res.json({code: 0, message: "Error"});
    }
}
// Thuc hien viec update version vao apk meta + seotitle trong cron App.js
async function changeVersionApk(postId, newVersion, newSize, noteText) {
    try{        
        var post = await Post.findOne({
            where:{
                id: postId
            },
            attributes: ['id','seotitle', 'title', 'off_update_version'],
            include:[{
                model: Postlang,
                as: "PostLang",
                attributes: ['id','seotitle', 'langid']
            },{
                model: Apkmeta,
                as: "apk",
                attributes: ['version']
            }]
        });
        if(post != null && !post.off_update_version){
            var objUpdate = {};
            objUpdate.version = newVersion;
            if(newSize!==""){
                objUpdate.apk_size = newSize;
            }            
            var oldVersion = post.apk.version,
                seotitle = post.seotitle,
                newseotitle = seotitle.replace(oldVersion, newVersion),
                arrMsg = [];
            // check version nay da tung chay auto update chua
            var checkExistVersion = await LogAutoUpdateVersion.count({
                where:{
                    postid: post.id,
                    oldversion: newVersion
                }
            })
            var maxVersionHadRunAuto = "";
            if(checkExistVersion > 0){
                // da chay roi thi lay version auto update moi nhat da tung chay
                var maxVersionExist = await LogAutoUpdateVersion.findOne({
                    where:{
                        postid: post.id
                    },
                    attributes:['oldversion'],
                    order:[
                        [sequelize.fn('CHAR_LENGTH', sequelize.col('oldversion')), 'desc'],
                        ['oldversion', 'desc']
                    ]
                })
                // neu version moi nhat da tung chay va version moi bang nhau thi ko chay nua
                maxVersionHadRunAuto = (maxVersionExist != null) ? maxVersionExist.oldversion : "";
            }
            //console.log(newVersion != "" && oldVersion !== newVersion && ((maxVersionHadRunAuto == "" && checkExistVersion == 0) || (maxVersionHadRunAuto == newVersion)))
            //console.log("%s ov=%s nv=%s, mv=%s, cev=%d", post.seotitle, oldVersion, newVersion, maxVersionHadRunAuto, checkExistVersion)
            if(newVersion != "" && oldVersion != "" && oldVersion !== newVersion && ((maxVersionHadRunAuto == "" && checkExistVersion == 0) || (maxVersionHadRunAuto == newVersion))){
                await Apkmeta.update(objUpdate,{
                    where: {
                        postid: postId
                    }
                });
                seotitle = newseotitle;
                if(seotitle.includes(newVersion)){
                    await Post.update({
                        seotitle: seotitle,
                        modifiedat: new Date()
                    },{
                        where:{
                            id: postId
                        }
                    });
                    arrMsg.push({
                        status: true,
                        langid: "en",
                        text: "successfully"                        
                    });
                }else{
                    arrMsg.push({
                        status: false,
                        langid: "en",
                        text: "Version mới chưa được thay thế vào SEO Title - en"
                    });
                }
                var postlang = (post.PostLang) ? post.PostLang : [];
                await postlang.forEach(async pl =>{
                    let seotitle = pl.seotitle;
                    let plid = pl.id;
                    let pllangid = pl.langid;
                    let plseotitle = pl.seotitle;
                    seotitle = seotitle.replace(oldVersion, newVersion);
                    if(seotitle.includes(newVersion)){
                        await Postlang.update({
                            seotitle: seotitle
                        },{
                            where:{
                                id: plid
                            }
                        });
                    }else{
                        arrMsg.push({
                            status: false,
                            langid: pllangid,
                            title: plseotitle,
                            text: "Version mới chưa được thay thế vào SEO Title - " + pllangid
                        });
                    }
                });
            }
            //arrMsg = (checkExistVersion > 0) ? [] : arrMsg;
            if(arrMsg.length > 0){
                var baseObj = {};
                baseObj.postid = postId;
                baseObj.postname = post.title || "";
                baseObj.oldtitle = post.seotitle || "";
                baseObj.newtitle = newseotitle || "";
                baseObj.oldversion = oldVersion;
                baseObj.newversion = newVersion;
                baseObj.notes = noteText;
                baseObj.message = "";
                baseObj.logtype = "";
                baseObj.langid = "";
                arrMsg.forEach(async msg => {
                    var obj = baseObj;
                    obj.oldtitle = (msg.title) ? msg.title : obj.oldtitle;
                    obj.message = msg.text;
                    obj.logtype = (msg.status)?"success":"error";
                    obj.langid = msg.langid;
                    await LogAutoUpdateVersion.create(obj);
                });
            }            
        }
        return;
    }catch(err){
        console.log("err ", err)
        return;
    }
}
// Ajax tat thong bao loi update version tren dashboard
async function offAutoUpdateErrorNotice(req, res){
    try{
        var id = req.body.id || req.params.id;
        LogAutoUpdateVersion.update({
            approved: true
        },{
            where:{
                id:id
            }
        }).then(() => {
            return res.json({code:1, message: "The notice has been hide"});
        }).catch(() => {
            return res.json({code:0, message: "Cant remove this notice"});
        })
    }catch(err){
        return res.status(500).json({code:0, message: "Error"})
    }
}


module.exports = {
    singleApkFileLoading,
    changeVersionApk,
    offAutoUpdateErrorNotice
}
