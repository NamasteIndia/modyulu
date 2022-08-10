module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("tracer"), {
        userid: {
            type: type.INTEGER,
            allowNull: true
        },
        ip: {
            type: type.STRING(100),
            allowNull: false
        },
        agent: {
            type: type.TEXT,
            defaultValue: ""
        },
        objectid: {
            type: type.INTEGER,
            allowNull: true
        },
        object: {
            type: type.STRING(45),
            defaultValue: ""
        },
        action: {
            type: type.STRING(45),
            defaultValue: ""
        },
        notes: {
            type: type.TEXT,
            defaultValue: ""
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}