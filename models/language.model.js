module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("languages"), {
        id: {
            type: type.STRING(10),
            allowNull: false,
            primaryKey: true
        },
        codelang: {
            type: type.STRING(45),
            allowNull: false
        },
        name: {
            type: type.STRING(45),
            allowNull: false
        },
        area: {
            type: type.STRING(45),
            allowNull: false
        },
        isblock: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        ismain: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}