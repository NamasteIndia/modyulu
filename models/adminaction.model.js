module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix + "admin_actions", {
        name: {
            type: type.STRING(255)
        },
        url: {
            type: type.STRING(255)
        },
        code: {
            type: type.STRING(255)
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}