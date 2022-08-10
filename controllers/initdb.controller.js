const bcrypt = require('bcryptjs');
const db = require('../models');
const Role = db.role;
const RoleFeatures = db.rolefeature;
const User = db.user;
const Category = db.category;
const Post = db.post;
const Language = db.language;
const Type = db.type;
const Option = db.option;
const Menu = db.menu;
const SiteFeatures = db.sitefeature;
const config = require('config');
const appConf = config.get('app');
const gameSlug = appConf.gameSlug || 'games';
const gameId = appConf.gameId || 1;
const appSlug = appConf.appSlug || 'apps';
const appId = appConf.appId || 2;
const createdTime = new Date();

exports.initial = () => {
  let dataOptions = require('../migration/options.json');
  if (dataOptions) Option.bulkCreate(dataOptions);

  let dataTypes = require('../migration/types.json');
  if (dataTypes) {
    Type.bulkCreate(dataTypes).then((types) => {
      types.forEach((type) => {
        if (type.id == 'post-blog') {
          type.addCatetype('category-blog');
          type.addCatetype('tags');
        }
      });
      types.forEach((type) => {
        if (type.id == 'post-apk') {
          type.addCatetype('category-apk');
          type.addCatetype('developer-apk');
          type.addCatetype('tags');
        }
      });
    });
  }

  let dataSiteFeatures = require('../migration/siteFeatures.json');
  if (dataSiteFeatures) SiteFeatures.bulkCreate(dataSiteFeatures);

  let dataLangs = require('../migration/languages.json');
  if (dataLangs) Language.bulkCreate(dataLangs);

  let dataRoles = require('../migration/roles.json');
  if (dataRoles) Role.bulkCreate(dataRoles);

  let dataRoleFeatures = require('../migration/roleFeatures.json');
  if (dataRoleFeatures) RoleFeatures.bulkCreate(dataRoleFeatures);

  let dataCategories = require('../migration/categories.json');
  if (dataCategories) {
    dataCategories = dataCategories.map((c) => {
      switch (c.title) {
        case 'Games':
          c.id = gameId;
          c.slug = gameSlug;
          c.fullslug = gameSlug;
          break;
        case 'Apps':
          c.id = appId;
          c.slug = appSlug;
          c.fullslug = appSlug;
          break;
        default:
          break;
      }
      return c;
    });
    Category.bulkCreate(dataCategories);
  }

  let dataPosts = require('../migration/posts.json');
  if (dataPosts) {
    dataPosts = dataPosts.map((p) => ({ ...p, modifiedat: createdTime, publishedat: createdTime }));
    Post.bulkCreate(dataPosts);
  }

  let dataUser = require('../migration/user.json');
  if (dataUser) User.create(dataUser);

  let dataMenu = require('../migration/menu.json');
  if (dataMenu) Menu.bulkCreate(dataMenu);
};
