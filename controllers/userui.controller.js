const db = require("../models");
const Userui = db.userui;

// Submit Add User Ui
exports.Add = async(req, res) => {
    try{
        var userid = req.session.userid;
        userid = (userid) ? userid : "";
        var screenid = req.body.screenid;
        screenid = (screenid) ? screenid : "";
        var jsontext = req.body.jsontext;
        jsontext = (jsontext) ? jsontext : "";
        if(userid == "" || screenid == "" || jsontext == ""){
            res.json({code: 0, message:"Params is not valid"});
            return;
        }
        const count = await Userui.count({
            where:{
                userid: userid,
                screenid: screenid
            }
        });
        if(count > 0){
            await Userui.update({                
                jsontext: jsontext
            },{
                where:{
                    userid: userid,
                    screenid: screenid
                }
            }).then(()=>{
                res.json({ code: 1, message:"Successfully" });
            }).catch(err=>{
                console.log(err.message);
                res.json({ code: 0, message:"Error" });
            });
        }else{
            await Userui.create({
                userid: userid,
                screenid: screenid,
                jsontext: jsontext
            }).then(()=>{
                res.json({ code: 1, message:"Successfully" });
            }).catch(err=>{
                console.log(err.message);
                res.json({ code: 0, message:"Error" });
            });
        }        
    }catch(err){
        console.log(err);
        res.json({code: 0, message: "Error" });
    }
}
// Lay thong tin User Ui
exports.findOne = (req, res) => {
    try{
        var userid = req.session.userid || "",
            screenid = req.params.screenid || "";
            if(userid == "" || screenid == ""){
                res.json({code: 0, message:"Params is not valid"});
                return;
            }
        Userui.findOne({
            where: {
                userid: userid,
                screenid: screenid
            }
        }).then( ui =>{
            res.json({code: 1, message:"Successfully", data: ui});
        }).catch(()=>{
            res.json({code: 0, message:"Error" });
        });
    }catch(err){
        res.json({code: 0, message:"Error" });
    }
}
// Reset screenUi User Ui
exports.Delete = (req, res) => {
    try{
        var userid = req.session.userid || "",
            screenid = req.params.screenid || "";
            if(userid == "" || screenid == ""){
                res.json({code: 0, message:"Params is not valid"});
                return;
            }
        Userui.destroy({
            where: {
                userid: userid,
                screenid: screenid
            }
        }).then( ui =>{
            res.json({code: 1, message:"Successfully", data: ui});
        }).catch(()=>{
            res.json({code: 0, message:"Error" });
        });
    }catch(err){
        res.json({code: 0, message:"Error" });
    }
}