const db = require("../models");
const Tracer = db.tracer;
const User = db.user;

async function addTracking(ip, agent, userid, object, objectid, action, notes){
    try{
        await Tracer.create({
            ip: ip || "",
            agent: agent || "",
            object: object,
            objectid: objectid,            
            action: action,
            notes: notes,
            userid: userid || null
        })
    }catch(err){}
}

async function getTracking(object, objectid){
    try{
        const tracer = Tracer.findAll({
            where:{
                object: object,
                objectid: objectid
            },
            include: {
                model: User,
                as: "Author",
                attributes: ['id', 'username', 'firstname', 'lastname'],
                required: false
            },
            order: [
                ["createdAt", "DESC"]
            ],
            limit: 20
        })
        return tracer;
    }catch(err){
        return [];
    }
}

module.exports = {
    addTracking,
    getTracking
}