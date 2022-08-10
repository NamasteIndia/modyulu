module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("comments"), {
        name: {
            type: type.STRING(255),
            allowNull: false,
        },
        email: {
            type: type.STRING(255),
            allowNull: false,
        },
        website: {
            type: type.STRING(255),
        },
        content: {
            type: type.TEXT,
            allowNull: false,
        },
        parentid: {
            type: type.INTEGER,
            allowNull: true,
        },
        postid: {
            type: type.INTEGER,
            allowNull: false,
        },
        commentstatus: {
            type: type.STRING(20),
            defaultValue: "pending"
        },
        ipaddress: {
            type: type.STRING(45),
            allowNull: true
        },
        useragent: {
            type: type.STRING(255),
            allowNull: true
        },
        authorid: {
            type: type.INTEGER,
            allowNull: true,
        },
        countchilds: {
            type: type.INTEGER,
            defaultValue: 0
        },
        rating: {
            type: type.INTEGER,
            defaultValue: 0
        },
        numlike: {
            type: type.INTEGER,
            defaultValue: 0
        },
        viewed: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        langid: {
            type: type.STRING(10),
            defaultValue: ""
        }
    });
}