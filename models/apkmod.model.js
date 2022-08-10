module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("apkmod"), {
        postid: {
            type: type.INTEGER,
            allowNull: true
        },
        title: {
            type: type.STRING
        },
        description: {
            type: type.TEXT
        },
        showinsingle: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        isoriginal: {
            type: type.BOOLEAN,
            defaultValue: false
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