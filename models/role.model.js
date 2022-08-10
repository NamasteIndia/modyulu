module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix + "roles", {
        rolename: {
            type: type.STRING(45),
            allowNull: false,
            validate: {
                len: [3, 45]
            }
        },
        description: {
            type: type.TEXT
        },
        ismaster: {
            type: type.BOOLEAN,
            defaultValue: false
        }
    }, {
        indexes: [{
            unique: true,
            fields: ['rolename']
        }]
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}