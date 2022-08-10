module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("log_update_versions"), {
        postid: {
            type: type.INTEGER,
            allowNull: false
        },
        langid: {
            type: type.STRING(20),
            allowNull: true
        },
        postname: {
            type: type.STRING(255),
            defaultValue: ""
        },
        oldversion: {
            type: type.STRING(255),
            defaultValue: ""
        },
        newversion: {
            type: type.STRING(255),
            defaultValue: ""
        },
        oldtitle: {
            type: type.TEXT,
            defaultValue: ""
        },
        newtitle: {
            type: type.TEXT,
            defaultValue: ""
        },
        logtype: {
            type: type.STRING(45),
            defaultValue: ""
        },
        message: {
            type: type.STRING(255),
            defaultValue: ""
        },
        notes: {
            type: type.STRING(255),
            defaultValue: ""
        },
        approved: {
            type: type.BOOLEAN,
            defaultValue: false
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}