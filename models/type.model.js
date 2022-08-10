module.exports = (sequelize, type, table) => {
    const Type = sequelize.define(table.prefix.concat("types"), {
        id: {
            type: type.STRING(45),
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: type.STRING(255),
            allowNull: false
        },
        description: {
            type: type.STRING(255),
            allowNull: true
        },
        type: {
            type: type.STRING(45),
            allowNull: true,
            defaultValue: "post" // post, category
        },
        allowindex: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        allowfollow: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        cateitemtype: {
            type: type.STRING(45), // hierarchy, single, multiple
            allowNull: true
        },
        roottext: {
            type: type.STRING(45), // developer, ringtones
            allowNull: true,
            defaultValue: ""
        },
        exttext: {
            type: type.STRING(45), // .html
            allowNull: true,
            defaultValue: ""
        },
        hassitemap: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        isblock: {
            type: type.BOOLEAN,
            defaultValue: false
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });

    Type.findCateTypeOfPostType = async(postType) => {
        const tbName = table.prefix.concat("post_cate_types"),
            query = `SELECT pct.ctypeid 
                    FROM ${tbName} pct 
                    WHERE pct.ptypeid = '${postType}'`;
        var cateTypes = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
        var arrCatetypes = cateTypes.map(catetype => catetype.ctypeid);
        return arrCatetypes;
    };

    Type.findPostTypeOfCateType = async(cateType) => {
        const tbName = table.prefix.concat("post_cate_types"),
            query = `SELECT pct.ptypeid 
                    FROM ${tbName} pct 
                    WHERE pct.ctypeid = '${cateType}'`;
        var postTypes = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
        var arrPosttypes = postTypes.map(posttype => posttype.ptypeid);
        return arrPosttypes;
    };

    return Type;
}