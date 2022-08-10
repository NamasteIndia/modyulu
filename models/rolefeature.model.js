module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix + "role_features", {
        sitefeatureid:{
            type: type.INTEGER,
            allowNull: false
        },
        roleid:{
            type: type.INTEGER,
            allowNull: false
        },
        actview: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        actadd: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        actedit: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        actdel: {
            type: type.BOOLEAN,
            defaultValue: false
        }        
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}