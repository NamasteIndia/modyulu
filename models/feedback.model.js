module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("feedbacks"), {
        name: {
            type: type.STRING(255),
            allowNull: false
        },
        email: {
            type: type.STRING(255),
            allowNull: false
        },
        link: {
            type: type.STRING(255),
            allowNull: false
        },
        subject: {
            type: type.STRING(255),
            allowNull: false
        },
        content: {
            type: type.TEXT,
            allowNull: false
        },
        image: {
            type: type.STRING(255),
            defaultValue: ""
        },
        ipaddress: {
            type: type.STRING(45),
            allowNull: true
        },
        useragent: {
            type: type.TEXT,
            allowNull: true
        },
        fbstatus: {
            type: type.STRING(45), //pending, finished
            defaultValue: "pending"
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}