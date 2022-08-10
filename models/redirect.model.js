module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix + "redirects", {
        oldslug: {
            type: type.TEXT,
            allowNull: false,
        },
        newslug: {
            type: type.TEXT,
            allowNull: false,
        },
        type: {
            type: type.STRING(45),
            defaultValue: "301"
        },
        objtype: {
            type: type.STRING(45), // post, cate
            allowNull: false
        },
        isblock: {
            type: type.BOOLEAN,
            defaultValue: false
        },
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}