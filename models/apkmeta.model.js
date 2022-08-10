module.exports = (sequelize, type, table) => {
    return sequelize.define(table.prefix.concat("apkmeta"), {
        playstore_url: {
            type: type.STRING
        },
        app_name: {
            type: type.STRING
        },
        package_name: {
            type: type.STRING
        },
        price: {
            type: type.STRING,
            defaultValue: ""
        },
        pricetext: {
            type: type.STRING
        },
        ccy: {
            type: type.STRING
        },
        os: {
            type: type.STRING
        },
        version: {
            type: type.STRING
        },
        apk_size: {
            type: type.STRING
        },
        developer_name: {
            type: type.STRING
        },
        developer_slug: {
            type: type.STRING
        },
        url_android: {
            type: type.STRING
        },
        url_ios: {
            type: type.STRING
        },
        url_pc: {
            type: type.STRING
        },
        video_review_url: {
            type: type.STRING
        },
        header_image: {
            type: type.STRING
        },
        recent_changed_text: {
            type: type.TEXT
        },
        mod_text: {
            type: type.STRING
        },
        off_update_version: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        show_slide: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        off_mod: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        off_apk_text: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        off_mod_text: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        off_ads_redirect: {
            type: type.BOOLEAN,
            defaultValue: false
        },
        show_ads_pagedown2: {
            type: type.BOOLEAN,
            defaultValue: false
        },
    }, {
        engine: table.engine,
        underscored: true,
        timestamp: true
    });
}