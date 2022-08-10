module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("apkfaqs"), {
        title: {
            type: type.TEXT,
            defaultValue: ""
        },
        content: {
            type: type.TEXT,
            defaultValue: ""
        },
        numsort: {
            type: type.INTEGER,
            defaultValue: 0
        },
        langid: {
            type: type.STRING(10),
            defaultValue: "en"
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
}