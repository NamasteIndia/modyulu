module.exports = (sequelize, type, table) => {
    const tbName = table.prefix.concat("posts");
    const Post = sequelize.define(tbName, {
        parentid: {
            type: type.INTEGER,
            allowNull: true
        },
        slug: {
            type: type.STRING(255),
            allowNull: false
        },
        title: {
            type: type.TEXT,
            allowNull: false
        },
        description: {
            type: type.TEXT,
            allowNull: true
        },
        content: {
            type: type.TEXT,
            allowNull: true
        },
        seotitle: {
            type: type.TEXT,
            allowNull: false
        },
        seodescription: {
            type: type.TEXT,
            allowNull: false
        },
        seoschema: {
            type: type.TEXT,
            defaultValue: ""
        },
        posttype: {
            type: type.STRING(45), // apk, blog, ringstone, page
            allowNull: false
        },
        poststatus: {
            type: type.STRING(45), // apk, blog, ringstone, page
            allowNull: false
        },
        publishedat: {
            type: type.DATE,
            allowNull: false
        },
        modifiedat: {
            type: type.DATE,
            allowNull: false
        },
        postorder: {
            type: type.INTEGER,
            defaultValue: 0
        },
        adsid: {
            type: type.INTEGER,
            allowNull: true
        },
        offadsall: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        offads: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        offadscontent: {
            type: type.BOOLEAN,
            defaultValue: false
        },
		offadsdownload: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        adsslot1: {
            type: type.TEXT,
            allowNull: true
        },
        adsslot2: {
            type: type.TEXT,
            allowNull: true
        },
        adsslot3: {
            type: type.TEXT,
            allowNull: true
        },
        adsslot4: {
            type: type.TEXT,
            allowNull: true
        },
        islikemain: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        notenglish: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        allowcomment: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        commentcount: {
            type: type.INTEGER,
            defaultValue: 0
        },
        likecount: {
            type: type.INTEGER,
            defaultValue: 0
        },
        viewcount: {
            type: type.INTEGER,
            defaultValue: 0
        },
        viewcountday: {
            type: type.INTEGER,
            defaultValue: 0
        },
        viewcountweek: {
            type: type.INTEGER,
            defaultValue: 0
        },
        ratingcount: {
            type: type.INTEGER,
            defaultValue: 0
        },
        ratingaverage: {
            type: type.DECIMAL(2, 1),
            defaultValue: 0
        },
        allowindex: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        allowfollow: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        showmodapk: {
            type: type.BOOLEAN,
            defaultValue: true
        },
        nolink: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        off_update_version: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        thumbnail: {
            type: type.INTEGER,
            allowNull: true
        },
        template: {
            type: type.STRING,
            allowNull: true
        },
    }, {
        indexes: [{
            unique: true,
            fields: ['slug']
        }]
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });

    Post.findPostLangAvailable = async(curLangId, postId) => {
        const tbPostName = tbName,
            tbPostLangName = table.prefix.concat("postlangs"),
            tbLanguageName = table.prefix.concat("languages"),
            query = `SELECT lang.id, lang.codelang, lang.name, lang.ismain
                    FROM ${tbLanguageName} lang
                    WHERE lang.ismain = true AND lang.id not like '${curLangId}'
                    UNION ALL 
                    SELECT lang.id, lang.codelang, lang.name, lang.ismain
                    FROM(
                        SELECT DISTINCT IF(p.islikemain, l.id, pl.langid) langid
                        FROM ${tbPostName} p 
                            LEFT JOIN ${tbPostLangName} pl ON p.id = pl.postid
                            INNER JOIN ${tbLanguageName} l 
                        WHERE p.id = ${postId} AND l.ismain = false AND l.isblock = false
                    ) xxx INNER JOIN ${tbLanguageName} lang ON xxx.langid = lang.id
                    WHERE lang.id not like '${curLangId}'`;
        const postlangs = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
        return postlangs;
    }

    Post.findPostLangAvailableFull = async(postId) => {
        const tbPostName = tbName,
            tbPostLangName = table.prefix.concat("postlangs"),
            tbLanguageName = table.prefix.concat("languages"),
            query = `SELECT lang.id, lang.name, lang.ismain
                    FROM ${tbLanguageName} lang
                    WHERE lang.ismain = true 
                    UNION ALL 
                    SELECT lang.id, lang.name, lang.ismain
                    FROM(
                        SELECT DISTINCT IF(p.islikemain, l.id, pl.langid) langid
                        FROM ${tbPostName} p 
                            LEFT JOIN ${tbPostLangName} pl ON p.id = pl.postid
                            INNER JOIN ${tbLanguageName} l 
                        WHERE p.id = ${postId} AND l.ismain = false AND l.isblock = false
                    ) xxx INNER JOIN ${tbLanguageName} lang ON xxx.langid = lang.id`;
        const postlangs = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
        return postlangs;
    };

    Post.findPostLangAvailableFullText = async(postId) => {
        var post = await Post.findPostLangAvailableFull(postId);
        return post.map(a => a.id).join(",");
    }

    return Post;
}