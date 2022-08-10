module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix + "authtoken", {
        token: {
            type: type.TEXT,
            allowNull: false,
        },
        username: {
            type: type.STRING(45),
            defaultValue: ""
        },
        hit: {
            type: type.INTEGER,
            defaultValue: 0
        },
        isblock: {
            type: type.BOOLEAN,
            defaultValue: false
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    })
}