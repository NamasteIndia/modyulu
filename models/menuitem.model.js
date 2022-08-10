module.exports = (sequelize, type, table) => {
    const MenuItems = sequelize.define(table.prefix.concat("menuitems"), {
        parentid: {
            type: type.INTEGER,
            allowNull: true
        },
        name: {
            type: type.STRING(255),
            allowNull: false
        },
        type: {
            type: type.STRING(20), // home, link, language, post, category
            allowNull: false
        },
        objectid: {
            type: type.INTEGER,
            defaultValue: 0
        },
        objectslug: {
            type: type.TEXT
        },
        objecttitle: {
            type: type.TEXT
        },
        alllanguage: {
            type: type.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        objectlangs: {
            type: type.TEXT
        },
        numsort: {
            type: type.INTEGER,
            defaultValue: 1
        },
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });

    MenuItems.findMenuByLang = async(menuId, langId) => {
        const tableItemName = table.prefix.concat("menuitems");
        const tableItemLangName = table.prefix.concat("menuitem_langs");
        const query = `SELECT mi.id, COALESCE(mil.name, mi.name) name, mi.type, mi.objectid, mi.objectslug, mi.objecttitle, mi.parentid
        FROM ${tableItemName} mi LEFT JOIN ${tableItemLangName} mil ON mi.id = mil.mitemid AND mil.langid='${langId}'
        WHERE menuid = '${menuId}' AND (alllanguage=true OR objectlangs like '%${langId}%')
        ORDER BY numsort`;
        const items = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
        return items;
    };

    return MenuItems;
}