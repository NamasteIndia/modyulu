const db = require("../models");
var ejs = require('ejs');
const config = require("config");
var xssFilters = require('xss-filters');
const cfTable = config.get('database.table');
const tbCommentName = cfTable.prefix.concat("comments");
const sequelize = db.Sequelize;
const Sequelize = db.sequelize;
const Op = db.Sequelize.Op;
const Comment = db.comment;
const CommentLike = db.commentlike;
const Post = db.post;
const User = db.user;
const numCommentInPage = 5;
const errorController = require('./error.controller');

// Hien thi page quan tri comment trong admin
exports.showComment = async (req, res) => {
    try {
        if (!req.roleAction || !req.roleAction.actview) {
            return errorController.render403Ajax(req, res);
        }
        var postid = req.params.postid || "%";
        var status = req.params.status || "%";
        res.render("admin/comment", { postid, status });
    } catch (err) {
        return errorController.render500(req, res);
    }
}
// Tao relay trong admin
exports.ReplyCommentAdmin = async (req, res) => {
    try {
        if (!req.roleAction || !req.roleAction.actadd) {
            return errorController.render403Ajax(req, res);
        }
        var parentid = req.body.parentid || null,
            rootid = null,
            postid = req.body.postid || 0,
            ip = req.ipAddr || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            agent = req.userAgent || req.get('User-Agent'),
            userid = req.session.userid || 0;
        ip = (ip == "::1") ? "127.0.0.1" : ip;
        ip = ip.split(":").pop();
        var commentParent = await Comment.findOne({ where: { id: parentid }, attributes: ['langid'] });
        if (parentid !== null) {
            rootid = await this.getRootId(parentid);
        }
        if (postid == 0 || postid == undefined || postid == null) {
            res.json({ code: 0, message: "This post is not exist" });
            return;
        }
        const user = await User.findOne({ where: { id: userid }, attributes: ['username', 'nickname', 'firstname', 'lastname', 'email'] })
        if (user === null) {
            res.json({ code: 0, message: "Please singin" });
            return;
        }
        await Comment.create({
            postid: postid,
            parentid: parentid,
            name: user.nickname || user.username,
            email: user.email,
            website: domain,
            content: req.body.content,
            ipaddress: ip,
            useragent: agent,
            commentstatus: "published",
            authorid: userid,
            rootid: rootid,
            langid: (commentParent) ? commentParent.langid : ""
        }).then(() => {
            res.json({ code: 1, message: "Reply is success" });
        }).catch(() => {
            res.json({ code: 0, message: "Reply is error" });
        })
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// Lay thong tin cua 1 comment
exports.getCommentById = async (req, res) => {
    try {
        if (!req.roleAction || !req.roleAction.actview) {
            return errorController.render403Ajax(req, res);
        }
        var id = req.body.id || req.params.id || "";
        const comment = await Comment.findOne({ where: { id: id } });
        if (comment == null) {
            return errorController.render404Ajax(req, res);

        }
        return res.json({ code: 1, message: "Successfully", data: comment });
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// Thuc hien update comment status trong admin
exports.UpdateCommentStatus = async (req, res) => {
    try {
        var id = req.body.id || "",
            value = req.body.value || "";
        var curComment = await Comment.findOne({
            where: {
                id: id
            }
        })
        // Comment khong ton tai
        if (curComment == null) {
            return errorController.render404Ajax(req, res);
        }
        // Check quyen Edit comment hoac Author
        if (curComment.authorid !== req.session.userid) {
            if (!req.roleAction || !req.roleAction.actedit) {
                return errorController.render403Ajax(req, res);
            }
        }
        // Thuc hien update comment status
        curComment.commentstatus = value;
        curComment.save();
        return res.json({ code: 1, message: "Record was updated successfully" });
    } catch (err) {
        res.json({ code: 0, message: "Error" });
    }
}
// Thuc hien bulk action trong admin
exports.Bulk = async (req, res) => {
    try {
        var ids = req.body.id;
        var action = req.body.action;
        switch (action) {
            case "delete":
                req.body.id = ids;
                this.Delete(req, res);
                break;
            default:
                res.json({ code: 0, message: "This action is not exist" });
                break;
        }
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// implement delete
exports.Delete = async (req, res) => {
    try {
        var id = req.params.id || req.body.id || "",
            where = { id: id };
        // Neu khong co quyen del thi chi del nhung comment mine
        if (!req.roleAction || !req.roleAction.actdel) {
            where.authorid = req.session.userid || "";
        }
        var rsDestroy = await Comment.destroy({
            where: where
        });
        if (rsDestroy <= 0) {
            return res.json({ code: 0, message: "This comment can't delete" });
        }
        return res.json({ code: 1, message: "Records was deleted successfully" });
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// implement update 
exports.UpdateComment = async (req, res) => {
    try {
        var id = req.body.id || "";
        const curComment = await Comment.findOne({ where: { id: id } });
        // Comment khong ton tai
        if (curComment == null) {
            return errorController.render404Ajax(req, res);
        }
        // Check quyen Edit comment hoac Author
        if (curComment.author !== req.session.userid) {
            if (!req.roleAction || !req.roleAction.actedit) {
                return errorController.render403Ajax(req, res);
            }
        }
        curComment.content = req.body.content || "";
        curComment.name = req.body.name || "";
        curComment.email = req.body.email || "";
        curComment.website = req.body.website || "";
        curComment.commentstatus = req.body.commentstatus || "pending";
        curComment.save();
        return res.json({ code: 1, message: "Update successfully" });
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// load data for datatable
exports.Datatable = async (req, res) => {
    try {
        var where = {},
            search = req.query.columns[1].search.value,
            status = req.query.columns[2].search.value || "%",
            postid = req.query.columns[3].search.value || "%",
            offset = Number(req.query.start) || 0,
            length = Number(req.query.length) || 10,
            sortColumn = "id",
            sortType = req.query.order[0].dir;
        sortColumn = (req.query.order[0].column == 1) ? "name" : sortColumn;
        sortColumn = (req.query.order[0].column == 2) ? "content" : sortColumn;
        sortColumn = (req.query.order[0].column == 3) ? "postid" : sortColumn;
        sortColumn = (req.query.order[0].column == 4) ? "createdAt" : sortColumn;
        if (search) {
            where = {
                [Op.or]: [{
                    name: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    email: {
                        [Op.like]: `%${search}%`
                    }
                },
                {
                    website: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    content: {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    '$post.title$': {
                        [Op.like]: `%${search}%`
                    }
                }, {
                    '$post.slug$': {
                        [Op.like]: `%${search}%`
                    }
                }
                ]
            }
        }
        if (status != "%") {
            where.commentstatus = status;
        }
        if (postid != "%") {
            where.postid = postid;
        }
        const tbCommentName = cfTable.prefix.concat("comments");
        var roleAction = (req.roleAction) ? req.roleAction : {};
        const comments = await Comment.findAndCountAll({
            where: where,
            attributes: {
                include: [
                    'id',
                    'name',
                    'email',
                    'ipaddress',
                    'content', [
                        sequelize.literal(`(select count(*) from ${tbCommentName} d where d.postid=${tbCommentName}.postid and d.commentstatus = 'published' )`),
                        'approve'
                    ],
                    [
                        sequelize.literal(`(select count(*) from ${tbCommentName} d where d.postid=${tbCommentName}.postid and d.commentstatus = 'pending' )`),
                        'pending'
                    ],
                    [sequelize.literal(`${(roleAction.actview) ? roleAction.actview : 0}`), 'roleview'],
                    [sequelize.literal(`${(roleAction.actadd) ? roleAction.actadd : 0}`), 'roleadd'],
                    [sequelize.literal(`${(roleAction.actedit) ? roleAction.actedit : 0}`), 'roleedit'],
                    [sequelize.literal(`${(roleAction.actdel) ? roleAction.actdel : 0}`), 'roledel'],
                    [sequelize.literal(`${req.session.userid}`), 'mine'],
                ]
            },
            include: [{
                model: Post,
                as: "post",
                attributes: ['id', 'title', 'slug'],
                required: true
            }, {
                model: Comment,
                as: "parent",
                attributes: ['id', 'name'],
                required: false
            }],
            order: [
                [sortColumn, sortType]
            ],
            offset: offset,
            limit: length
        });
        res.json({ aaData: comments.rows, iTotalDisplayRecords: comments.count, iTotalRecords: comments.count });
    } catch (err) {
        res.json({ code: 0, message: "Error" });
    }
}
// get rootId
exports.getRootId = async (parentId) => {
    const query = `SELECT comment.id
                        FROM (
                            SELECT
                                @r AS _id,
                                (SELECT @r := parentid FROM ${tbCommentName} WHERE id = _id) AS parentid,
                                @l := @l + 1 AS lvl
                            FROM
                                (SELECT @r := ${parentId}, @l := 0) vars,
                                ${tbCommentName} m
                            WHERE @r <> 0) subcomment
                        JOIN ${tbCommentName} comment ON subcomment._id = comment.id
                        ORDER BY subcomment.lvl DESC`;
    const comments = await db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT });
    return (comments.length > 0) ? comments[0].id : null;
}

// get list comment of postid
exports.getListCommentByPostid = async (langId, postId, page, sort) => {
    try {
        var offset = (page * numCommentInPage) - numCommentInPage,
            comments = {},
            order = [];
        switch (sort) {
            case "best":
                order.push(['numlike', 'DESC'], ['id', 'DESC']);
                break;
            case "top":
                order.push(['rating', 'DESC'], ['id', 'DESC']);
                break;
            default:
                order.push(['id', 'DESC']);
                break;
        }
        comments = await Comment.findAndCountAll({
            attributes: {
                include: ['id', 'name', 'rating', 'numlike', 'content', 'createdAt', [sequelize.literal(`(select count(*)
                from ${tbCommentName} d
                where d.commentstatus='published' 
                and d.langid like '${langId}'
                and d.postid = ${tbCommentName}.postid 
                and d.rootid = ${tbCommentName}.id )`),
                    'countchilds'
                ]]
            },
            // include: [{
            //     model: User,
            //     as: "author",
            //     attributes: ['avatar', 'username', 'nickname', 'roleid']
            // }
            // , {
            //     model: CommentLike,
            //     as: "likes",
            //     attributes:['userid'],
            //     where:{
            //         userid: userid
            //     }
            // }],
            where: {
                postid: postId,
                parentid: null,
                commentstatus: "published",
                langid: langId
            },
            order: order,
            offset: offset,
            limit: numCommentInPage
        });
        /*
        comments.rows.forEach(c => {
            Comment.findAll({
                attributes: ['id', 'name', 'content', 'rating', 'numlike', 'createdAt'],
                where: {
                    commentstatus: "published",
                    rootid: c.id,
                    langid: langId
                },
                include: [{
                    model: User,
                    as: "author",
                    attributes:['avatar', 'username', 'nickname', 'roleid']
                }],
                order: order,
                offset: 0,
                limit: numCommentInPage,
            }).then(all => {
                c.allchildren = (all) ? all : [];
            });
        });
        */
        var maxPage = Math.ceil(comments.count / numCommentInPage);
        comments.curPage = page;
        comments.maxPage = maxPage;
        return comments;
    } catch (err) {
        console.log(err)
        return { count: 0, rows: [] };
    }
}

exports.getLineRating = async (postId, langId) => {
    try {
        var rs = {
            numComment: 0,
            numReview: 0,
            numReviewLang: 0,
            point: 0,
            stars: [0, 0, 0, 0, 0],
            percent: []
        };
        const arr = await Comment.findAll({
            attributes: [
                'langid',
                'rating',
                [sequelize.fn('count', sequelize.col('rating')), 'count']
            ],
            where: {
                commentstatus: "published",
                postid: postId,
                parentid: null
            },
            group: ['langid', 'rating'],
            order: [['rating', 'DESC']],
            raw: true
        });
        arr.forEach(item => {
            var inx = item.rating - 1;
            if (inx >= 0) rs.stars[inx] += item.count;
            if (item.langid == langId) rs.numReviewLang += item.count;
            rs.numReview += item.count;
            rs.point += (item.rating * item.count);
        });
        rs.stars.forEach(star => {
            rs.percent.push(Math.round(star * 100 / rs.numReview) || 0);
        });
        rs.point = parseFloat((rs.point / rs.numReview).toFixed(1)) || 0;
        rs.numComment = await Comment.count({
            where: {
                commentstatus: "published",
                postid: postId,
                langid: {
                    [Op.like]: langId
                }
            },
            raw: true
        });
        return rs;
    } catch (err) {
        console.log(err)
        return {};
    }
}
// get list comment of postid
exports.getListCommentByUserid = async (userId, page) => {
    try {
        var offset = (page * numCommentInPage) - numCommentInPage,
            comments = {};
        comments = await Comment.findAndCountAll({
            attributes: {
                include: ['id', 'name', 'content', 'createdAt', [sequelize.literal(`(select count(*)
                from ${tbCommentName} d
                where d.commentstatus='published' 
                and d.postid = ${tbCommentName}.postid
                and d.parentid = ${tbCommentName}.id
                and d.authorid not like ${userId}
                and d.viewed = false )`),
                    'countchilds'
                ]]
            },
            include: [{
                model: Comment,
                as: "children",
                attributes: ['id', 'name', 'content', 'createdAt'],
                where: {
                    commentstatus: "published"
                },
                order: [
                    ['id', "DESC"]
                ],
                offset: 0,
                limit: numCommentInPage,
                separate: true
            }, {
                model: Post,
                as: "post",
                attributes: ['slug', 'title']
            }, {
                model: User,
                as: "author",
                attributes: ['avatar', 'nickname']
            }],
            where: {
                authorid: userId,
                parentid: null,
                commentstatus: "published"
            },
            order: [
                ['id', "DESC"]
            ],
            offset: offset,
            limit: numCommentInPage
        });
        var maxPage = Math.ceil(comments.count / numCommentInPage);
        comments.curPage = page;
        comments.maxPage = maxPage;
        return comments;
    } catch (err) {
        return { count: 0, rows: [] };
    }
}
// get list comment of postid
exports.getListCommentByRootId = async (langId, rootId, page, sort) => {
    try {
        var offset = (page * numCommentInPage) - numCommentInPage,
            comments = {},
            order = [];
        switch (sort) {
            case "best":
                order.push(['numlike', 'DESC']);
                break;
            case "top":
                order.push(['rating', 'DESC']);
                break;
            default:
                order.push(['id', 'DESC']);
                break;
        }
        comments = await Comment.findAndCountAll({
            attributes: ['id', 'name', 'content', 'createdAt', 'numlike'],
            where: {
                //postid: postId,
                rootid: rootId,
                commentstatus: "published",
                langid: langId
            },
            // include: [{
            //     model: User,
            //     as: "author",
            //     attributes: ['avatar', 'nickname', 'username']
            // }, {
            //     model: CommentLike,
            //     as: "likes",
            //     attributes:['userid'],
            //     where:{
            //         userid: userid
            //     }
            // }],
            order: order,
            offset: offset,
            limit: numCommentInPage,

        });
        return comments;
    } catch (err) {
        return { count: 0, rows: [] };
    }
}
// count all comment postid
exports.getCountCommentOfPostid = async (langId, postId) => {
    const count = await Comment.count({
        where: {
            commentstatus: "published",
            postid: postId,
            langid: {
                [Op.like]: langId
            }
        }
    });
    return count;
}
// ajax add comment in frontend
exports.AddComment = async (req, res) => {
    try {
        var btnLoginHtml = `<div class="text-center"><a class="btn btnInLine" href="/login" rel="nofollow">${res.__("textLogin")}<a></div>`;
        if (!req.session.userid) {
            return res.json({ code: 401, message: res.__("textRequireLogin"), button: btnLoginHtml });
        }
        var token = req.body.token || "token",
            //token2 = req.session.ajaxpagetoken || "token2",
            newToken = functions.shuffle(),
            parentid = req.body.parentid || null,
            rootid = null,
            user = {},
            langid = (req.curLang && req.curLang.id) ? req.curLang.id : "",
            ip = req.ipAddr,
            agent = req.userAgent,
            userid = req.session.userid || null,
            name = (req.body.name) ? xssFilters.inHTMLData(req.body.name) : "",
            email = (req.body.email) ? xssFilters.inHTMLData(req.body.email) : "",
            content = (req.body.content) ? xssFilters.inHTMLData(req.body.content) : null,
            rating = (req.body.rating) ? parseInt(xssFilters.inHTMLData(req.body.rating)) : 0;
        parentid = (parentid == "") ? null : parentid;
        req.session.ajaxpagetoken = newToken;
        if (((rating <= 0 || rating > 5) && parentid == null) || content == "") {
            return res.json({ code: 0, message: res.__('textRequireFillComment') });
        }
        //if (token == token2) {
        if (token == token) {
            if (parentid !== null) {
                rootid = await this.getRootId(parentid);
            }
            if (userid != null) {
                user = await User.findOne({
                    where: { id: userid },
                    attributes: ['id', 'nickname', 'username', 'email']
                });
                name = (user.nickname) ? user.nickname : "";
                name = (name == "") ? user.username : name;
                email = user.email || "";
            }
            await Comment.create({
                postid: req.body.postid,
                parentid: parentid,
                rootid: rootid,
                name: name,
                email: email,
                content: content,
                rating: rating,
                ipaddress: ip,
                useragent: agent,
                authorid: userid,
                langid: langid
            }).then(() => {
                res.json({ code: 1, message: res.__('textCommentThanks'), token: newToken });
            }).catch(() => {
                res.json({ code: 0, message: res.__('textCommentWarning') });
            });
        } else {
            res.status(401).json({ code: 401, message: res.__("textRequireLogin"), button: btnLoginHtml });
        }
    } catch (err) {
        res.json({ code: 0, message: "Error" });
    }
}

// ajax add comment in frontend not login
exports.AddCommentNotLogin = async (req, res) => {
    try {
        var parentid = req.body.parentid || null,
            rootid = null,
            langid = (req.curLang && req.curLang.id) ? req.curLang.id : "",
            ip = req.ipAddr,
            agent = req.userAgent,
            userid = req.session.userid || null,
            name = (req.body.name) ? xssFilters.inHTMLData(req.body.name) : "",
            email = (req.body.email) ? xssFilters.inHTMLData(req.body.email) : "",
            content = (req.body.content) ? xssFilters.inHTMLData(req.body.content) : null,
            parentid = (parentid == "") ? null : parentid;
        if (parentid !== null) {
            rootid = await this.getRootId(parentid);
        }

        await Comment.create({
            postid: req.body.postid,
            parentid: parentid,
            rootid: rootid,
            name: name,
            email: email,
            content: content,
            ipaddress: ip,
            useragent: agent,
            authorid: userid,
            langid: langid
        }).then(() => {
            res.json({ code: 1, message: res.__('textCommentThanks') });
        }).catch(() => {
            res.json({ code: 0, message: res.__('textCommentWarning') });
        });
    } catch (err) {
        res.json({ code: 0, message: "Error" });
    }
}

// ajax add comment in frontend
exports.AddCommentLike = async (req, res) => {
    try {
        var btnLoginHtml = `<div class="text-center"><a class="btn btnInLine" href="/login" rel="nofollow">${res.__("textLogin")}<a></div>`;
        var token = req.body.token || "token",
            //token2 = req.session.ajaxpagetoken || "token2",
            newToken = functions.shuffle(),
            userid = req.session.userid || null,
            id = req.body.id,
            isLike = true;
        if (userid == null) {
            return res.json({ code: 401, message: res.__("textRequireLogin"), button: btnLoginHtml });
        }
        req.session.ajaxpagetoken = newToken;
        //if (token == token2) {
        if (token == token) {
            var comment = await Comment.findOne({
                where: {
                    id: id
                }
            });
            if (comment != null) {
                var exist = await CommentLike.count({
                    where: {
                        cmtid: id,
                        userid: userid
                    }
                });
                if (exist <= 0) {
                    CommentLike.create({
                        userid: userid,
                        cmtid: id
                    });
                    isLike = false;
                    comment.numlike = comment.numlike + 1;
                } else {
                    CommentLike.destroy({
                        where: {
                            userid: userid,
                            cmtid: id
                        }
                    });
                    comment.numlike = comment.numlike - 1;
                }
                comment.save();
                return res.json({ code: 1, message: "Success", isLike: isLike, numLike: comment.numlike });
            } else {
                return res.json({ code: 0, message: res.__("textDataWrong") });
            }
        } else {
            res.status(401).json({ code: 401, message: res.__("textRequireLogin"), button: btnLoginHtml });
        }
    } catch (err) {
        console.log(err)
        res.json({ code: 0, message: "Error" });
    }
}
// ajax load more commnet pagination Fontend
exports.ajaxCommentPagination = async (req, res) => {
    try {
        var postId = req.body.pid,
            langId = req.body.lid || "",
            sort = req.body.sort || "",
            offset = req.body.offset || 0,
            curPage = Math.floor(offset / numCommentInPage) + 1;
        const comments = await this.getListCommentByPostid(langId, postId, curPage, sort);
        var html = [];
        fileCommentRender = "views/web/includes/comment-loop.ejs";
        html = await ejs.renderFile(fileCommentRender, { comments: comments.rows });
        return res.json({ code: 1, message: "Successfully", data: html });
    } catch (err) {
        console.log(err)
        return res.json({ code: 0, message: "Error" });
    }
}
// ajax load more reply pagination Fontend
exports.ajaxReplyPagination = async (req, res) => {
    try {
        var parentId = req.body.parentid,
            offset = req.body.offset || 0,
            langId = req.body.lid || "",
            sort = req.body.sort || "best",
            curPage = Math.floor(offset / numCommentInPage) + 1;
        const comments = await this.getListCommentByRootId(langId, parentId, curPage, sort);
        var html = [],
            fileCommentRender = "views/web/includes/comment-item.ejs";
        await Promise.all(comments.rows.map(async (c) => {
            html.push(await ejs.renderFile(fileCommentRender, { comment: c }));
        }));
        return res.json({ code: 1, message: "Successfully", data: html.join("").trim() });
    } catch (err) {
        return res.json({ code: 0, message: "Error" });
    }
}
// ajax load more commnet pagination profile
exports.ajaxProfileCommentPagination = async (req, res) => {
    try {
        var userId = req.session.userid || "",
            offset = req.body.showed || 0,
            curPage = Math.floor(offset / numCommentInPage) + 1;
        if (userId == "") {
            return errorController.render403Ajax(req, res);
        }
        const comments = await this.getListCommentByUserid(userId, curPage);
        var html = "";
        fileCommentRender = "views/web/includes/comment-profile.ejs";
        html = await ejs.renderFile(fileCommentRender, { rows: comments.rows, page: { curLang: req.curLang } });
        html = html.trim();
        html = html.replace(/^<ul class="profile-comments">/g, "");
        html = html.replace(/<\/ul>$/g, "");
        var end = (Math.floor(comments.count / numCommentInPage) <= curPage);
        return res.json({ code: 1, message: "Successfully", data: html, end: end });
    } catch (err) {
        return errorController.render500Ajax(req, res);
    }
}
// update trang thai comment da doc
exports.offNotificationComment = async (userid, postid) => {
    try {
        var query = `update ${tbCommentName} set viewed = true where id in(
                        select d.id
                        from ${tbCommentName} d, ${tbCommentName} p
                        where d.commentstatus='published' 
                        and d.postid = p.postid
                        and d.parentid = p.id
                        and d.authorid not like ${userid}
                        and d.viewed = false
                        and p.commentstatus='published' 
                        and p.parentid is null
                        and p.authorid = ${userid}
                        and d.postid = ${postid}
                    )`;
        return Sequelize.query(query, { type: Sequelize.QueryTypes.UPDATE })
    } catch (err) {
        return false;
    }
}
// lay comment user chua doc -> thong nao
exports.countNotificationComment = async (userid) => {
    try {
        var query = `select count(d.id) numComments
                        from ${tbCommentName} d, ${tbCommentName} p
                        where d.commentstatus='published' 
                        and d.postid = p.postid
                        and d.parentid = p.id
                        and d.authorid not like ${userid}
                        and d.viewed = false
                        and p.commentstatus='published' 
                        and p.parentid is null
                        and p.authorid = ${userid}`;
        const rs = await Sequelize.query(query, { type: Sequelize.QueryTypes.SELECT })
        return rs[0].numComments;
    } catch (err) {
        return 0;
    }
}