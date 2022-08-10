const db = require("../models");
const apkFAQs = db.apkfaq;
const errorController = require("./error.controller");
const tracerController = require("./tracer.controller");

// Ajax them Faq trong form Edit post
exports.AddFaq = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }        
        var numsort = req.body.numsort;
        numsort = parseInt(numsort) || 0;
		numsort = numsort + 1;
        var title = req.body.title || "",
            content = req.body.content || "";
        if(title=="" || content==""){
            return res.json({ code: 0, message: "Title and Content cant be empty"});
        }
        await apkFAQs.create({
            title: req.body.title,
            content: req.body.content,
            postid: req.body.postid,
            numsort: numsort,
            langid: req.body.langid || 'pt'
        }).then(async faq => {            
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", req.body.postid, "edit", `Add faq ${req.body.title}`);
            res.json({ code: 1, message: "Faq was added successfully", data: faq });
        }).catch(() => {            
            res.json({ code: 0, message: "Faq was added error"});
        });
    }catch(err){
        console.log(err)
        return errorController.render500Ajax(req, res);
    }
}

// Ajax sua Faq trong form Edit post
exports.EditFaq = async (req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.body.faqid;
        var faq = await apkFAQs.findOne({
            where: {
                id: id
            }
        })
        if(faq == null){
            return errorController.render404Ajax(req, res);
        }
        faq.title = req.body.faqtitle || "";
        faq.content = req.body.faqcontent || "";
        faq.save();

        //console.log(req.body.content)
        // add tracer
        await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", faq.postid, "edit", `Edit faq ${req.body.title}`);
        return res.json({ code: 1, message: "Faq was updated successfully", data: faq });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

// Ajax sort faq trong form Edit post
exports.EditFaqNumSort = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var data = req.body.data || "[]",
            json = JSON.parse(data);
        json.forEach(async function(d,i) {
            let updateObj = {};
            updateObj.numsort = d.numsort || 0;
            //console.log(d.id, updateObj);
            await apkFAQs.update(updateObj,{
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

// Ajax delete Faq trong form Edit post
exports.DeleteFaq = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403Ajax(req, res);
        }
        var id = req.body.id;
        var faq = await apkFAQs.findOne({
            where: {
                id: id
            }
        })
        if(faq == null){
            return errorController.render404Ajax(req, res);
        }
        faq.destroy({
            where: {
                id
            }
        }).then(async delCount => {
            if(delCount <= 0){
                return res.json({ code: 0, message: "Faq can't delete" });
            }
            // add tracer
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, "post", faq.postid, "del", `Delete faq ${faq.title}`);
            return res.json({ code: 1, message: "Faq was deleted success" });
        }).catch(() => {            
            return res.json({ code: 0, message: "Faq was deleted error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}