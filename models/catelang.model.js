module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("catelangs"), {
        cateid: {
            type: type.INTEGER,
            allowNull: false
        },
        langid: {
            type: type.STRING(10),
            allowNull: false
        },
        title: {
            type: type.TEXT,
            allowNull: false
        },
        description: {
            type: type.TEXT
        },
        seotitle: {
            type: type.TEXT,
            allowNull: false
        },
        seodescription: {
            type: type.TEXT,
            allowNull: false
        },
        offadslang: {
            type: type.BOOLEAN,
            defaultValue: false
        }
    }, {
        indexes: [{
            unique: true,
            fields: ['cateid', 'langid']
        }]
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}