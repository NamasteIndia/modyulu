const db = require('../models');
const config = require("config");
const jsonCfInterActive = config.get("interactive");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Sequelize = db.sequelize;
const Interactive = db.interactive;
const Post = db.post;
const Category = db.category;
const Ringtone = db.ringtone;
exports.AddViewPage = async(req, res) => {
    try{
        var yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        var hoursago = new Date();
        hoursago.setMinutes(hoursago.getMinutes() - (jsonCfInterActive.viewtime || 5));
        var lastweek = new Date();
        lastweek.setHours(lastweek.getHours() - (24 * 7));
        var postId = req.postId;
        if (postId) {
            var view = await Interactive.findOne({
                where: {
                    iatype: "view",
                    objtype: "post",
                    objectid: postId,
                    createdAt: {
                        [Op.gte]: yesterday
                    }
                }
            });
            if (!view) {
                view = await Interactive.create({
                    iatype: "view",
                    objtype: "post",
                    objectid: postId,
                    point: 1,
                    useragent: '',
                    ipaddress: ''
                });
            }else{
                view.point = parseInt(view.point) + 1;
                view.save();
            }
            var viewcountday = (view.point) ? view.point : 1;
            var query = `select sum(point) viewcountweek
                        from cms_interactives 
                        where objectid = ${postId} 
                        and objtype = 'post' 
                        and iatype = 'view' 
                        and createdAt >= '${lastweek}'`;
            const sum7 = await Sequelize.query(query, {type: Sequelize.QueryTypes.SELECT});            
            var viewcountweek = (sum7 && sum7[0].viewcountweek) ? sum7[0].viewcountweek : 1;
            await Post.update({
                viewcountday: viewcountday,
                viewcountweek: viewcountweek,
                //viewcountday: sequelize.literal('viewcountday + 1'), // 1 ngay sau xoa
                //viewcountweek: sequelize.literal('viewcountweek + 1'), // 1 tuan sau xoa
                viewcount: sequelize.literal('viewcount + 1')
            }, {
                where: {
                    id: postId
                }
            });
        }        
    }catch(err){
        console.log(err)
    }
};

exports.AddRating = async(req, res) => {
    var objtype = (req.body.pageType) ? req.body.pageType : "",
        objectid = (req.body.id) ? req.body.id : 0,
        point = (req.body.rating) ? req.body.rating : 1,
        ip = req.ipAddr,
        agent = req.userAgent,
        token = req.body.token || "token",
        token2 = req.session.ajaxpagetoken || "token2",
        newToken = functions.shuffle();
    req.session.ajaxpagetoken = newToken;
    //if (token == token2) {
    if (token == token) {
        const count = await Interactive.count({
            where: {
                iatype: "rating",
                objtype: objtype,
                objectid: objectid,
                ipaddress: ip
            }
        });
        if (count <= 0) {
            await Interactive.create({
                iatype: "rating",
                objtype: objtype,
                objectid: objectid,
                point: point,
                ipaddress: ip,
                useragent: agent
            });
            var rating = await Interactive.findAll({
                where: {
                    iatype: "rating",
                    objectid: objectid,
                    objtype: objtype
                },
                attributes: [
                    [sequelize.fn('count', sequelize.col('point')), 'count'],
                    [sequelize.fn('avg', sequelize.col('point')), 'average']
                ],
                raw: true
            });
            var ratingObj = rating[0] || {};
            var total = ratingObj.count;
            var average = ratingObj.average;
            switch (objtype) {
                case "post":
                    await Post.update({
                        ratingcount: total,
                        ratingaverage: average
                    }, {
                        where: {
                            id: objectid
                        }
                    });
                    break;
                case "category":
                    await Category.update({
                        ratingcount: total,
                        ratingaverage: average
                    }, {
                        where: {
                            id: objectid
                        }
                    });
                    break;
            }
            var data = {
                total: total,
                average: average
            }
            res.json({ code: 1, message: res.__('ratingTextThanks'), data: data, token: newToken });
        } else {
            res.json({ code: 0, message: res.__('ratingTextRefuse'), token: newToken });
        }
    } else {
        res.json({ code: 0, message: "", token: newToken });
    }
};

exports.AddVote = async(req, res) => {
    var objtype = (req.body.pageType) ? req.body.pageType : "",
        objectid = (req.body.id) ? req.body.id : 0,
        ip = req.ipAddr,
        agent = req.userAgent,
        token = req.body.token || "token",
        token2 = req.session.ajaxpagetoken || "token2",
        newToken = functions.shuffle();
    req.session.ajaxpagetoken = newToken;
    //if (token == token2) {
    if (token == token) {
        const voteCount = await Interactive.count({
            where: {
                iatype: "love",
                objtype: objtype,
                objectid: objectid,
                ipaddress: ip
            }
        });
        if (voteCount <= 0) {
            await Interactive.create({
                iatype: "love",
                objtype: objtype,
                objectid: objectid,
                point: 1,
                ipaddress: ip,
                useragent: agent
            });
            switch (objtype) {
                case "post":
                    await Post.update({
                        likecount: sequelize.literal('likecount + 1')
                    }, {
                        where: {
                            id: objectid
                        }
                    });
                    break;
                case "category":
                    await Category.update({
                        likecount: sequelize.literal('likecount + 1')
                    }, {
                        where: {
                            id: objectid
                        }
                    });
                    break;
                case "ringtone":
                    await Ringtone.update({
                        numvotes: sequelize.literal('numvotes + 1')
                    }, {
                        where: {
                            id: objectid
                        }
                    });
                    break;
            }
            res.json({ code: 1, message: "Thanks for your voting", token: newToken });
        } else {
            res.json({ code: 0, message: "You had voted before", token: newToken });
        }
    } else {
        res.json({ code: 0, message: "", token: newToken });
    }
};

exports.Ringtone = async(req, res) => {
    var objectid = (req.body.id) ? req.body.id : 0,
        action = req.query.act || "",
        objUpdate = {},
        token = req.body.token || "token",
        token2 = req.session.ajaxpagetoken || "token2",
        newToken = functions.shuffle();
    req.session.ajaxpagetoken = newToken;
    switch(action){
        case "download":
            objUpdate.numdownload = sequelize.literal('numdownload + 1');
            break;
        case "listen":
            objUpdate.numlisten = sequelize.literal('numlisten + 1');
            break;
        default:
            objUpdate.numvotes = sequelize.literal('numvotes + 1');
            break;
    }
    //if (token == token2) {
    if (token == token) {
        Ringtone.update(objUpdate, {
            where: {
                id: objectid
            }
        }).then(() => {
            return res.json({ code: 1, message: "Thanks!", token: newToken });
        })
    } else {
        res.json({ code: 0, message: "", token: newToken });
    }
};
