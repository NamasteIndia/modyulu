module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("menuitem_langs"), {
        langid: {
            type: type.STRING(20),
            allowNull: false
        },
        name: {
            type: type.STRING(255),
            allowNull: false
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}