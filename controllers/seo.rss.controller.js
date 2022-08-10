const sha1 = require('sha1');
const db = require("../models");
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Post = db.post;
const PostLang = db.postlang;
const Apkmeta = db.apkmeta;
const Media = db.media;
const Category = db.category;
exports.homeRss = async(req, res) => {
    const curLang = req.curLang;
    var langId = req.params.langid || "",
		cateSlug = req.params.cateslug || null,
        category = null,
        cateIds = [];
	langId = (curLang.ismain && langId=="") ? curLang.id : langId;
	if(langId != curLang.id){
		return res.status(404).send("Not found");
	}
    if(cateSlug!=null){
        category = await Category.findOne({
            where: {
                slug: cateSlug
            },
            include:{
                model: Category,
                as: "Childrens",
                attributes: ['id', 'slug', 'title'],
                required: false
            },
            attributes: ['id', 'slug', 'fullslug', 'title']
        });
        cateIds.push(category.id);
        category.Childrens.map(c => {
            cateIds.push(c.id);
        })
    }
    const rss = await this.getPostRss(curLang, cateIds);
    var rootUrl = (curLang.ismain == true) ? domain : `${domain}/${curLang.id}`;
    var rootUrl2 = (category) ? `${rootUrl}/${category.fullslug}` : rootUrl;
    var docTitle = (category) ? category.title : sitename;
    if (rss.length > 0) {
        var xmlString = `<rss version="2.0">
                            <channel rel="self">
                                <title>${docTitle} - RSS FEED</title>
                                <link><![CDATA[${rootUrl2}]]></link>
                                <ttl>60</ttl>
                                <copyright>${sitename}</copyright>
                                <pubDate>${functions.formart_datetime(new Date(), 'seo')}</pubDate>
                                <generator>${sitename}</generator>
                                <docs>${rootUrl2}</docs>`;
        rss.forEach(item => {
            let post = (curLang.ismain) ? item : functions.postMaping(item);
            let postId = sha1(post.id);
            //let postUrl = `${rootUrl}/${post.slug}.html`;
            let postUrl = `${rootUrl}/${post.slug}/`;
            let img = (post.thumb && post.thumb.url) ? post.thumb.url : `${domain}/assets/image/no-image.jpg`;
            img = (post.icon && post.icon.url) ? post.icon.url : img;
            let postTitle = "";
            let postDesc = (!curLang.ismain && post.PostLang && post.PostLang.length > 0) ? post.PostLang[0].description : post.description;
            if (post.posttype == "post-apk") {
                //postTitle = (post.showmodapk == true) ? `${post.title} Mod Apk ${post.apk.version}` : `${post.title} ${post.apk.version}`;
				postTitle = post.title;
				postTitle += (!post.apk.off_mod_text) ? modText: "";
				postTitle += (!post.apk.off_apk_text) ? apkText: "";
				postTitle += ` ${post.apk.version}`;
				postTitle += ((post.apk.mod_text) ? ` (${post.apk.mod_text})` : '');
			} else {
                postTitle = (!curLang.ismain && post.PostLang && post.PostLang.length > 0) ? post.PostLang[0].title : post.title;
            }
            xmlString += `<item>
                            <title>
                                <![CDATA[${postTitle}]]>
                            </title>
                            <link>
                                <![CDATA[${postUrl}]]>
                            </link>
                            <guid isPermaLink="false">
                                <![CDATA[ ${postId} ]]>
                            </guid>
                            <description>
                                <![CDATA[ <a href="${postUrl}"><img src="${img}"/></a>${postDesc}]]>
                            </description>
                            <pubDate>
                                <![CDATA[ ${functions.formart_datetime(post.modifiedat, "seo")} ]]>
                            </pubDate>
                        </item>`;
        });
        xmlString += `</channel></rss>`;
        res.set('Content-Type', 'text/xml');
        res.send(xmlString);
    } else {
        res.status(404).send("Not found");
    }
}
exports.getPostRss = async(curLang, cateId) => {
    try {
        var rss = [];
        var where = {
            posttype: ['post-apk', 'post-blog'],
            poststatus: 'published',
            publishedat: {
                [Op.lte]: sequelize.fn("NOW")
            },
        };        
        if(cateId.length > 0){
            where.dcateid = cateId
        }
        if (curLang.ismain == true) {
            where.notenglish = false;
            rss = await Post.findAll({
                include: [{
                    model: Media,
                    as: 'thumb',
                    attributes: ['url']
                }, {
                    model: Media,
                    as: 'icon',
                    attributes: ['url']
                }, {
                    model: Apkmeta,
                    as: 'apk',
                    attributes: ['version', 'mod_text', 'off_mod_text', 'off_apk_text']
                }],                
                where: where,
                attributes: ['id', 'slug', 'title', 'seotitle', 'description', 'seodescription', 'showmodapk', 'posttype', 'publishedat', 'modifiedat', 'createdAt'],
                order: [
                    ['modifiedat', 'DESC']
                ],
                limit: 30
            })
        } else {
            where = {
                posttype: ['post-apk', 'post-blog'],
                poststatus: 'published',
                publishedat: {
                    [Op.lte]: sequelize.fn("NOW")
                },
                [Op.or]: {
                    islikemain: true,
                    [Op.and]: {
                        islikemain: false,
                        '$PostLang.langid$': curLang.id,
                    }
                }
            };
            if(cateId.length > 0){
                where.dcateid = cateId
            }
            rss = await Post.findAll({
                include: [{
                    model: Media,
                    as: 'thumb',
                    attributes: ['url']
                }, {
                    model: Media,
                    as: 'icon',
                    attributes: ['url']
                }, {
                    model: Apkmeta,
                    as: 'apk',
                    attributes: ['version', 'mod_text', 'off_mod_text', 'off_apk_text']
                }, {
                    model: PostLang,
                    as: "PostLang",
                    where: {
                        langid: curLang.id
                    },
                    attributes: ['title', 'seotitle', 'description', 'seodescription'],
                    required: false
                }],                
                where: where,
                attributes: ['id', 'slug', 'title', 'seotitle', 'description', 'seodescription', 'showmodapk', 'posttype', 'publishedat', 'modifiedat', 'createdAt'],
                order: [
                    ['modifiedat', 'DESC']
                ],
                limit: 30,
                subQuery: false,
            })
        }
        return rss;
    } catch (err) {
        console.log(err)
        return [];
    }
}