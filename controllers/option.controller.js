const db = require('../models');
const Option = db.option;
const errorController = require("./error.controller");

exports.showPage = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actview){
            return errorController.render403(req, res);
        }
        const options = await Option.findAll();
        return res.render("admin/option", { options });
    }catch(err){
        return errorController.render500(req, res);
    }    
}

exports.AddOption = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actadd){
            return errorController.render403Ajax(req, res);
        }
        await Option.create({
            metakey: req.body.metakey,
            metavalue: req.body.metavalue,
            fieldlabel: req.body.fieldlabel,
            inputtype: req.body.inputtype
        }).then(option => {
            res.json({ code: 1, message: "Option was added successfully", data: option });
        }).catch(() => {
            res.json({ code: 0, message: "Option was added error" });
        });
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}

exports.UpdateOption = async(req, res) => {
    try{
        if(!req.roleAction || !req.roleAction.actedit){
            return errorController.render403Ajax(req, res);
        }
        var arrPromises = [],
            arrKey = req.body.key,
            arrValue = req.body.metavalue,
            arrType = req.body.type;
        for (let i = 0; i < arrKey.length; i++) {
            let val = arrValue[i];
            if (arrType[i] == 'checkbox') {
                val = (val == "true") ? "true" : "false";
            }        
            arrPromises.push(
                await Option.update({
                    metavalue: val
                }, {
                    where: {
                        metakey: arrKey[i]
                    }
                })
            )
        }
        Promise.all(arrPromises).then(values => {
            res.json({ code: 1, message: "Update successfully" });
        }).catch(() => {
            res.json({ code: 0, message: "Update error" });
        })
    }catch(err){
        return errorController.render500Ajax(req, res);
    }
}