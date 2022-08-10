module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("log_apk_files"), {
        postid: {
            type: type.INTEGER,
            allowNull: false
        },
        package_name: {
            type: type.STRING(255),
            allowNull: false
        },
        apklink: {
            type: type.TEXT,
            defaultValue: ""
        },        
        apksize: {
            type: type.STRING(45),
            defaultValue: ""
        },
        obblink: {
            type: type.TEXT,
            defaultValue: ""
        },
        obbsize: {
            type: type.STRING(45),
            defaultValue: ""
        },
        apkversion: {
            type: type.STRING(255),
            defaultValue: ""
        },
        isloaded: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        isnolink: {
            type: type.BOOLEAN,
            defaultValue: false
        },
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}