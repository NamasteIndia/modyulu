module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("ads"), {
        adscode: {
            type: type.STRING(45),
            allowNull: false
        },
        name: {
            type: type.TEXT,
            allowNull: true
        },
        slot1: {
            type: type.TEXT,
            allowNull: true
        },
        slot2: {
            type: type.TEXT,
            allowNull: true
        },
        slot3: {
            type: type.TEXT,
            allowNull: true
        },
        slot4: {
            type: type.TEXT,
            allowNull: true
        },
        slot5: {
            type: type.TEXT,
            allowNull: true
        },
        slot6: {
            type: type.TEXT,
            allowNull: true
        },
        isdefault: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        appearheader: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        islazy: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        offads: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isheader: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isblock: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        indexes: [{
            unique: true,
            fields: ['adscode']
        }]
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}