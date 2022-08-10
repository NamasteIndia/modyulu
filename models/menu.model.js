module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("menu"), {
        id: {
            type: type.STRING(45),
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: type.STRING(255)
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}