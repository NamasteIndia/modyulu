const db = require("../models");
const Mod = db.apkmod;
const Apk = db.apkmeta;
const errorController = require('./error.controller');
const tracerController = require('./tracer.controller');

// Ajax them Mod trong form Edit post
exports.AddMod = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        var showinsingle = req.body.showinsingle;
        showinsingle = (showinsingle == 'on') ? true : false;
        var isoriginal = req.body.isoriginal;
        isoriginal = (isoriginal == 'on') ? true : false;
        var numsort = req.body.numsort;
        numsort = parseInt(numsort) || 0;
		numsort = numsort + 1;
        var apk = await Apk.findOne({
            where:{
                id: req.body.apkid || ""
            },
            attributes: ['postid']
        })
        if(apk==null){
            return errorController.render404Ajax(req, res);
        }
        await Mod.create({
            title: req.body.title,
            description: req.body.description,
            showinsingle: showinsingle,
            isoriginal: isoriginal,
            apkid: req.body.apkid,
            numsort: numsort,
            postid: apk.postid || null
        }).then(async mod => {
            // add tracer
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", apk.postid, "edit", `Add mod ${req.body.title}`);
            res.json({ code: 1, message: "Mod was added successfully", data: mod });
        }).catch(() => {
            res.json({ code: 0, message: "Mod was added error"});
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Ajax sua mod trong form Edit post
exports.EditMod = async (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.body.id;
        var showinsingle = req.body.showinsingle || false;
        var isoriginal = req.body.isoriginal || false;
        //showinsingle = (showinsingle == true) ? true : false;
        var mod = await Mod.findOne({
            where: {
                id: id
            }
        })
        if(mod == null){
            return errorController.render404Ajax(req, res);
        }
        mod.title = req.body.title || "";
        mod.description = req.body.description || "";
        mod.showinsingle = showinsingle;
        mod.isoriginal = isoriginal;
        mod.save();
        // add tracer
        await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", mod.postid, "edit", `Edit mod ${req.body.title}`);
        var rs = req.body;
        rs.showinsingle = showinsingle;
        return res.json({ code: 1, message: "Mod was updated successfully", data: rs });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}
// Ajax sort mod trong form Edit post
exports.EditModNumSort = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var data = req.body.data || "[]",
            json = JSON.parse(data);
        json.forEach(async function(d,i) {
            let modUpdateObj = {};
            modUpdateObj.numsort = d.numsort || 0;
            if(i==0){
                modUpdateObj.showinsingle = true;
            }
            await Mod.update(modUpdateObj,{
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
// Ajax delete mod trong form Edit post
exports.DeleteMod = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.body.id;
        var mod = await Mod.findOne({
            where: {
                id: id
            }
        })
        if(mod == null){
            return errorController.render404Ajax(req, res);
        }
        Mod.destroy({
            where: {
                id
            }
        }).then(async delCount => {
            if(delCount <= 0){
                return res.json({ code: 0, message: "Mod can't delete" });
            }
            // add tracer
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", mod.postid, "edit", `Delete mod ${mod.title}`);
            return res.json({ code: 1, message: "Mod was deleted success" });
        }).catch(() => {
            return res.json({ code: 0, message: "Mod was deleted error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}