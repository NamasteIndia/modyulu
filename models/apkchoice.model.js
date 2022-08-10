module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix + "apkchoice", {
        pids: {
            type: type.TEXT
        },
        langid: {
            type: type.STRING(10),
            defaultValue: "es"
        }
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}