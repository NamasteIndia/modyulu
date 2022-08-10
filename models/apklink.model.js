module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("apklink"), {
        postid: {
            type: type.INTEGER,
            allowNull: true
        },
        title: {
            type: type.STRING
        },
        link: {
            type: type.STRING
        },
        size: {
            type: type.STRING
        },
        numsort: {
            type: type.INTEGER,
            defaultValue: 0
        },
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}