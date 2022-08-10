module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("comments_like"), {
        userid: {
            type: type.INTEGER,
            allowNull: false,
        },
        cmtid: {
            type: type.INTEGER,
            allowNull: false,
        },
    });
}