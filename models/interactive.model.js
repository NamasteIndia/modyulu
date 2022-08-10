module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("interactives"), {
        iatype: {
            type: type.STRING(45), // view, vote (love), rate
            allowNull: false
        },
        objtype: {
            type: type.STRING(45), // post, category, ringtone
            allowNull: false
        },
        objectid: {
            type: type.INTEGER,
            allowNull: true
        },
        point: {
            type: type.INTEGER,
            defaultValue: 1
        },
        ipaddress: {
            type: type.STRING(45),
            allowNull: true
        },
        useragent: {
            type: type.TEXT,
            allowNull: true
        }
    }, {
        engine: table.engine,
        underscored: false,
        timestamp: false
    });
}