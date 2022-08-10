module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("ringtones"), {
        postid: {
            type: type.INTEGER,
            allowNull: false
        },
        name: {
            type: type.TEXT
        },
        author: {
            type: type.INTEGER,
            allowNull: true
        },
        url: {
            type: type.TEXT
        },
        filename: {
            type: type.STRING,
            allowNull: true
        },
        destination: {
            type: type.STRING,
            allowNull: true
        },
        filetype: {
            type: type.STRING(45)
        },
        filesize: {
            type: type.STRING(45)
        },
        numvotes: {
            type: type.INTEGER,
            defaultValue: 0
        },
        numdownload: {
            type: type.INTEGER,
            defaultValue: 0
        },
        numlisten: {
            type: type.INTEGER,
            defaultValue: 0
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}