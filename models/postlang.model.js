module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("postlang"), {
        postid: {
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
        content: {
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
        },
		offadsdownload: {
            type: type.BOOLEAN,
            defaultValue: false
        }
    }, {
        indexes: [{
            unique: true,
            fields: ['postid', 'langid']
        }]
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}