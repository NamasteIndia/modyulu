module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("medias"), {
        title: {
            type: type.TEXT,
            allowNull: true,
            defaultValue: ""
        },
        seotitle: {
            type: type.TEXT,
            allowNull: true,
            defaultValue: ""
        },
        description: {
            type: type.TEXT,
            allowNull: true,
            defaultValue: ""
        },
        note: {
            type: type.TEXT,
            allowNull: true,
            defaultValue: ""
        },
        filename: {
            type: type.STRING,
            allowNull: false
        },
        url: {
            type: type.STRING,
            allowNull: false
        },
        urlicon: {
            type: type.STRING,
            allowNull: true
        },
        filetype: {
            type: type.STRING(45),
            allowNull: true
        },
        filesize: {
            type: type.STRING(45),
            allowNull: true
        },
        type: {
            type: type.STRING(45),
            allowNull: true
        },
        imgwidth: {
            type: type.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        imgheight: {
            type: type.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        childsizes: {
            type: type.STRING,
            allowNull: true
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}