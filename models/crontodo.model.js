module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("cron_todos"), {
        postid: {
            type: type.INTEGER,
            allowNull: false
        },
        title: {
            type: type.TEXT,
            defaultValue: ""
        },
        package_name: {
            type: type.STRING(255),
            defaultValue: ""
        },
        oldversion: {
            type: type.STRING(255),
            defaultValue: ""
        },
        oldsize: {
            type: type.STRING(45),
            defaultValue: ""
        },
        scheduletime: {
            type: type.DATE,
            defaultValue: type.NOW,
            allowNull: false
        },
        newversion: {
            type: type.STRING(255),
            defaultValue: ""
        },
        newsize: {
            type: type.STRING(45),
            defaultValue: ""
        },
        isdone: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        iscantleech: {
            type: type.BOOLEAN,
            defaultValue: false
        },
    }, {
        engine: table.engine,
        timestamps: false,
    });
}