module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix + "site_features", {
        parentid:{
            type: type.INTEGER,
            allowNull: true
        },
        icon: {
            type: type.STRING(45),
            defaultValue: ""
        },
        title: {
            type: type.STRING(255),
            defaultValue: ""
        },
        name: {
            type: type.STRING(255),
            defaultValue: ""
        },
        description: {
            type: type.TEXT,
            defaultValue: ""
        },
        url: {
            type: type.STRING(255),
            defaultValue: ""
        },
        nolink: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        numsort: {
            type: type.INTEGER,
            defaultValue: 0
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}