module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix + "users", {
        username: {
            type: type.STRING(20),
            allowNull: false,
        },
        password: {
            type: type.STRING(255),
            allowNull: false
        },
        nickname: {
            type: type.STRING(255),
            defaultValue: ""
        },
        firstname: {
            type: type.STRING(45),
            allowNull: false
        },
        lastname: {
            type: type.STRING(45),
            allowNull: false
        },
        email: {
            type: type.STRING(255)
        },
        phone: {
            type: type.STRING(20),
        },
        avatar: {
            type: type.STRING(255),
            allowNull: true
        },
        bdd: {
            type: type.STRING(2),
            defaultValue: ""
        },
        bdm: {
            type: type.STRING(2),
            defaultValue: ""
        },
        bdy: {
            type: type.STRING(4),
            defaultValue: ""
        },
        gender: {
            type: type.STRING(20),
            defaultValue: ""
        },
        isblock: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        isactive: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        activecode: {
            type: type.TEXT,
            defaultValue: ""
        },
        recoveredcode: {
            type: type.STRING(45),
            defaultValue: ""
        }
    }, {
        indexes: [{
            unique: true,
            fields: ['username']
        }]
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    })
}