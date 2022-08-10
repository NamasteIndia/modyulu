module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("banner"), {
        langid: {
            type: type.STRING(20),
            allowNull: false
        },
        url: {
            type: type.TEXT,
            allowNull: false
        },
        img: {
            type: type.TEXT,
            allowNull: false
        },
        title: {
            type: type.TEXT,
            allowNull: true
        },
        default: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        isblock: {
            type: type.BOOLEAN,
            defaultValue: false
        },
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: false
    });
}