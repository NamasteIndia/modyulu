const db = require("../models");
const Modlink = db.apklink;
const Mod = db.apkmod;
const errorController = require('./error.controller');
const tracerController = require('./tracer.controller');

// Ajax them link trong form Edit post
exports.AddModlink = async(req, res) => {
    try{        
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var cmod = await Mod.findOne({
            where:{
                id: req.body.modid || ""
            },
            attributes: ['postid']
        })
        if(cmod==null){
            return errorController.render404Ajax(req, res);
        }
        await Modlink.create({
            title: req.body.title,
            link: req.body.link,
            size: req.body.size,
            modid: req.body.modid,
            postid: cmod.postid || null,
            numsort: req.body.numsort || 0
        }).then(async mod => {
            // add tracer
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", cmod.postid, "edit", `Add link ${req.body.title}`);
            return res.json({ code: 1, message: "Link was added successfully", data: mod });
        }).catch(() => {
            return res.json({ code: 0, message: "Link was added error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Ajax edit Link mo trong trang Edit post
exports.EditModlink = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }        
        var id = req.body.id || req.params.id || "";
        var modlink = await Modlink.findOne({
            where:{
                id: id
            }
        })
        if(modlink == null){
            return errorController.render404Ajax(req, res);
        }
        modlink.title = req.body.title || "";
        modlink.link = req.body.link || "";
        modlink.size = req.body.size || "";
        modlink.save();
        // add tracer
        await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", modlink.postid, "edit", `Edit link ${req.body.title}`);
        var data = req.body;
        res.json({ code: 1, message: "Link was updated successfully", data: data });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Ajax sort mod trong form Edit post
exports.EditModLinkNumSort = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var data = req.body.data || "[]",
            json = JSON.parse(data);
        json.forEach(async function(d,i) {
            let modlinkUpdateObj = {};
            modlinkUpdateObj.numsort = d.numsort || 0;
            if(i==0){
                modlinkUpdateObj.showinsingle = true;
            }
            await Modlink.update(modlinkUpdateObj,{
                where:{
                    id: d.id
                }
            });
        })
        return res.json({code:1, message: "Successfully"});
    }catch(err){        
        return errorController.render500Ajax(req, res);
    }    
}
// Ajax Del link mo trong trang Edit post
exports.DeleteModlink = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var id = req.body.id || req.params.id ||  "";
        var modlink = await Modlink.findOne({
            where:{
                id: id
            }
        })
        if(modlink==null){
            return errorController.render404Ajax(req, res);
        }
        Modlink.destroy({
            where: {
                id
            }
        }).then(async delCount => {
            if(delCount <= 0){
                return res.json({ code: 0, message: "Link can't deleted" });
            }
            // add tracer
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", modlink.postid, "edit", `Delete link ${modlink.title}`);
            res.json({ code: 1, message: "Link was deleted success" });
        }).catch(() => {
            res.json({ code: 0, message: "Link was deleted error" });
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}