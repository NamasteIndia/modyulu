module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("options"), {
        metakey: {
            type: type.STRING(45),
            allowNull: false
        },
        metavalue: {
            type: type.TEXT,
            allowNull: true
        },
        fieldlabel: {
            type: type.TEXT,
            allowNull: true
        },
        description: {
            type: type.TEXT,
            allowNull: true
        },
        inputtype: {
            type: type.STRING(20),
            allowNull: false,
            defalutValue: "input" // 
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}