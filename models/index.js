const config = require('config');
const cfDatabase = config.get('database');
const cfTable = config.get('database.table');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(cfDatabase.database, cfDatabase.username, cfDatabase.password, {
  host: cfDatabase.host,
  dialect: cfDatabase.dialect,
  pool: {
    max: cfDatabase.pool.max,
    min: cfDatabase.pool.min,
    acquire: cfDatabase.pool.acquire,
    idle: cfDatabase.pool.idle,
  },
  logging: cfDatabase.logging, //show sql query
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
// Option
db.option = require('../models/option.model.js')(sequelize, Sequelize, cfTable);
// User and Role table
db.user = require('../models/user.model.js')(sequelize, Sequelize, cfTable);
db.role = require('../models/role.model.js')(sequelize, Sequelize, cfTable);
db.user.belongsTo(db.role, { as: 'role', foreignKey: 'roleid', constraints: false });
db.user.belongsTo(db.user, { as: 'Author', foreignKey: 'author', constraints: false });
// Auth token
db.auth = require('../models/auth.model.js')(sequelize, Sequelize, cfTable);
// Language table
db.language = require('../models/language.model.js')(sequelize, Sequelize, cfTable);
// Ads table
db.ads = require('../models/ads.model.js')(sequelize, Sequelize, cfDatabase.table);
db.ads.belongsTo(db.user, { as: 'Author', foreignKey: 'author', constraints: false });
// Type table
db.type = require('../models/type.model.js')(sequelize, Sequelize, cfDatabase.table);
db.type.belongsToMany(db.type, {
  as: 'catetype',
  through: cfTable.prefix + 'post_cate_types',
  foreignKey: 'ptypeid',
  constraints: false,
});
db.type.belongsToMany(db.type, {
  as: 'posttype',
  through: cfTable.prefix + 'post_cate_types',
  foreignKey: 'ctypeid',
  constraints: false,
});
// Category table
db.category = require('../models/category.model.js')(sequelize, Sequelize, cfDatabase.table);
db.category.belongsTo(db.category, { as: 'Parent', foreignKey: 'parentid', constraints: false });
db.category.hasMany(db.category, { as: 'Childrens', foreignKey: 'parentid', constraints: false });
db.category.belongsTo(db.ads, { as: 'Ads', foreignKey: 'adsid', constraints: false });
db.category.belongsTo(db.user, { as: 'Author', foreignKey: 'author', constraints: false });
db.category.belongsTo(db.type, { as: 'Type', foreignKey: 'catetype', constraints: false });
// CateLang table
db.catelang = require('../models/catelang.model.js')(sequelize, Sequelize, cfDatabase.table);
db.catelang.belongsTo(db.category, {
  as: 'Cate',
  foreignKey: 'cateid',
  constraints: false,
  onDelete: 'cascade',
});
db.category.hasMany(db.catelang, { as: 'CateLang', foreignKey: 'cateid', constraints: false });
db.catelang.belongsTo(db.language, { as: 'Lang', foreignKey: 'langid', constraints: false });
// Post table
db.post = require('../models/post.model.js')(sequelize, Sequelize, cfDatabase.table);
db.post.belongsTo(db.type, { as: 'Type', foreignKey: 'posttype', constraints: false });
db.post.belongsTo(db.post, { as: 'Parent', foreignKey: 'parentid', constraints: false });
db.post.hasMany(db.post, { as: 'Children', foreignKey: 'parentid', constraints: false });
db.post.belongsTo(db.ads, { as: 'Ads', foreignKey: 'adsid', constraints: false });
db.post.belongsTo(db.user, { as: 'Author', foreignKey: 'author', constraints: false });
db.post.belongsToMany(db.category, {
  as: 'categories',
  through: cfTable.prefix + 'post_cates',
  foreignKey: 'postid',
  otherKey: 'cateid',
  constraints: false,
});
db.post.belongsToMany(db.category, {
  as: 'developer',
  through: cfTable.prefix + 'post_cates',
  foreignKey: 'postid',
  otherKey: 'cateid',
  constraints: false,
});
db.post.belongsToMany(db.category, {
  as: 'tags',
  through: cfTable.prefix + 'post_cates',
  foreignKey: 'postid',
  otherKey: 'cateid',
  constraints: false,
});
db.category.belongsToMany(db.post, {
  as: 'posts',
  through: cfTable.prefix + 'post_cates',
  foreignKey: 'cateid',
  otherKey: 'postid',
  constraints: false,
});
db.post.belongsTo(db.category, { as: 'defaultcate', foreignKey: 'dcateid', constraints: false });
// Apkmeta table
db.apkmeta = require('../models/apkmeta.model.js')(sequelize, Sequelize, cfDatabase.table);
db.apkmeta.belongsTo(db.post, {
  as: 'post',
  foreignKey: 'postid',
  constraints: false,
  onDelete: 'cascade',
});
db.post.hasOne(db.apkmeta, { as: 'apk', foreignKey: 'postid', constraints: false });
// Apkmod table
db.apkmod = require('../models/apkmod.model.js')(sequelize, Sequelize, cfDatabase.table);
db.apkmod.belongsTo(db.apkmeta, { as: 'apk', foreignKey: 'apkid', constraints: false });
db.apkmeta.hasMany(db.apkmod, { as: 'mods', foreignKey: 'apkid', constraints: false });
// Apklink table
db.apklink = require('../models/apklink.model.js')(sequelize, Sequelize, cfDatabase.table);
db.apklink.belongsTo(db.apkmod, { as: 'mod', foreignKey: 'modid', constraints: false });
db.apkmod.hasMany(db.apklink, { as: 'links', foreignKey: 'modid', constraints: false });
// ringstone table
db.ringtone = require('../models/ringtone.model.js')(sequelize, Sequelize, cfDatabase.table);
db.ringtone.belongsTo(db.post, {
  as: 'post',
  foreignKey: 'postid',
  constraints: false,
  onDelete: 'cascade',
});
db.post.hasMany(db.ringtone, { as: 'ringtone', foreignKey: 'postid', constraints: false });
db.ringtone.belongsTo(db.user, { as: 'Author', foreignKey: 'author', constraints: false });
// PostLang table
db.postlang = require('../models/postlang.model.js')(sequelize, Sequelize, cfDatabase.table);
db.postlang.belongsTo(db.post, {
  as: 'Post',
  foreignKey: 'postid',
  constraints: false,
  onDelete: 'cascade',
});
db.post.hasMany(db.postlang, { as: 'PostLang', foreignKey: 'postid', constraints: false });
db.postlang.belongsTo(db.language, { as: 'Lang', foreignKey: 'langid', constraints: false });
// Media table
db.media = require('../models/media.model.js')(sequelize, Sequelize, cfDatabase.table);
db.media.belongsTo(db.user, { as: 'Author', foreignKey: 'author', constraints: false });
db.media.belongsToMany(db.post, {
  as: 'posts',
  through: cfTable.prefix + 'post_screenshoots',
  foreignKey: 'mediaid',
  otherKey: 'postid',
  constraints: false,
});
db.post.belongsToMany(db.media, {
  as: 'screenshoots',
  through: cfTable.prefix + 'post_screenshoots',
  foreignKey: 'postid',
  otherKey: 'mediaid',
  constraints: false,
});
db.post.belongsTo(db.media, { as: 'thumb', foreignKey: 'thumbnail', constraints: false });
db.post.belongsTo(db.media, { as: 'icon', foreignKey: 'imgicon', constraints: false });
// Redirect table
db.redirect = require('../models/redirect.model.js')(sequelize, Sequelize, cfDatabase.table);
db.redirect.belongsTo(db.user, { as: 'Author', foreignKey: 'author', constraints: false });
// Menu table
db.menu = require('../models/menu.model.js')(sequelize, Sequelize, cfDatabase.table);
db.menuitem = require('../models/menuitem.model.js')(sequelize, Sequelize, cfDatabase.table);
db.menuitem.belongsTo(db.menu, {
  as: 'menu',
  foreignKey: 'menuid',
  constraints: false,
  onDelete: 'cascade',
});
db.menu.hasMany(db.menuitem, { as: 'items', foreignKey: 'menuid', constraints: false });
db.menuitemlang = require('../models/menuitemlang.model.js')(
  sequelize,
  Sequelize,
  cfDatabase.table
);
db.menuitemlang.belongsTo(db.menuitem, {
  as: 'menuitem',
  foreignKey: 'mitemid',
  constraints: false,
  onDelete: 'cascade',
});
db.menuitem.hasMany(db.menuitemlang, {
  as: 'mitemlangs',
  foreignKey: 'mitemid',
  constraints: false,
});
// User Inter Active
db.interactive = require('../models/interactive.model.js')(sequelize, Sequelize, cfDatabase.table);
//Comment
db.comment = require('../models/comment.model.js')(sequelize, Sequelize, cfDatabase.table);
db.comment.hasMany(db.comment, { as: 'children', foreignKey: 'parentid', constraints: false });
db.comment.hasMany(db.comment, { as: 'allchildren', foreignKey: 'rootid', constraints: false });
db.comment.belongsTo(db.comment, { as: 'parent', foreignKey: 'parentid', constraints: false });
db.comment.belongsTo(db.post, { as: 'post', foreignKey: 'postid', constraints: false });
db.comment.belongsTo(db.user, { as: 'author', foreignKey: 'authorid', constraints: false });
db.post.hasMany(db.comment, { as: 'comments', foreignKey: 'postid', constraints: false });
// Comment like
db.commentlike = require('../models/comment.like.model.js')(sequelize, Sequelize, cfDatabase.table);
db.commentlike.belongsTo(db.comment, { as: 'comment', foreignKey: 'cmtid', constraints: false });
db.comment.hasMany(db.commentlike, { as: 'likes', foreignKey: 'cmtid', constraints: false });
//Feedback
db.feedback = require('../models/feedback.model.js')(sequelize, Sequelize, cfDatabase.table);
//User UI
db.userui = require('../models/userui.model.js')(sequelize, Sequelize, cfDatabase.table);
//Log Apk Files
db.logapkfile = require('../models/logapkfile.model.js')(sequelize, Sequelize, cfDatabase.table);
//Log Auto Update Version Apk
db.logupdateversion = require('../models/logupdateversion.model.js')(
  sequelize,
  Sequelize,
  cfDatabase.table
);
db.logupdateversion.belongsTo(db.post, { as: 'post', foreignKey: 'postid', constraints: false });
//Cron todo
db.crontodo = require('../models/crontodo.model.js')(sequelize, Sequelize, cfDatabase.table);
//Tracer
db.tracer = require('../models/tracer.model.js')(sequelize, Sequelize, cfDatabase.table);
db.tracer.belongsTo(db.user, { as: 'Author', foreignKey: 'userid', constraints: false });
// Admin feature
db.sitefeature = require('../models/sitefeature.model.js')(sequelize, Sequelize, cfDatabase.table);
db.sitefeature.belongsTo(db.sitefeature, {
  as: 'parent',
  foreignKey: 'parentid',
  constraints: false,
});
// Role feature
db.rolefeature = require('../models/rolefeature.model.js')(sequelize, Sequelize, cfDatabase.table);
db.rolefeature.belongsTo(db.sitefeature, {
  as: 'sitefeature',
  foreignKey: 'sitefeatureid',
  constraints: false,
});
db.rolefeature.belongsTo(db.role, { as: 'role', foreignKey: 'roleid', constraints: false });
// Apk Home Choices
db.apkchoice = require('./apkchoice.model')(sequelize, Sequelize, cfDatabase.table);
// FAQs
db.apkfaq = require('./apkfaq.model')(sequelize, Sequelize, cfDatabase.table);
db.apkfaq.belongsTo(db.post, {
  as: 'post',
  foreignKey: 'postid',
  constraints: false,
  onDelete: 'cascade',
});
db.post.hasMany(db.apkfaq, { as: 'faq', foreignKey: 'postid', constraints: false });

db.ROLES = ['Admin', 'Editor', 'Subscriber'];

module.exports = db;
