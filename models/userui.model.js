module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix + "useruis", {
        userid: {
            type: type.STRING(20),
            allowNull: false,
        },
        screenid: {
            type: type.STRING(45),
            allowNull: false
        },
        jsontext: {
            type: type.TEXT,
            allowNull: false
        },
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    })
}