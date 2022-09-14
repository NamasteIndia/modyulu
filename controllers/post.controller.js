const config = require('config');
const appConf = config.get('app');
const apkleechCf = config.get('apkleech');
const db = require('../models');
const { createRedirectWhenChangeSlug } = require('./redirect.controller');
const errorController = require('../controllers/error.controller');
const tracerController = require('./tracer.controller');
const request = require('request-promise');
const { downloadImg } = require('./requestAPI.controller');
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Post = db.post;
const PostLang = db.postlang;
const Category = db.category;
const CateLang = db.catelang;
const Language = db.language;
const Ads = db.ads;
const User = db.user;
const Type = db.type;
const Apkmeta = db.apkmeta;
const Apkmod = db.apkmod;
const Apklink = db.apklink;
const Media = db.media;
const Option = db.option;
const Menuitem = db.menuitem;
const LogApkFile = db.logapkfile;
const ApkChoice = db.apkchoice;
const Apkfaq = db.apkfaq;
const gameSlug = appConf.gameSlug || 'games';
const appSlug = appConf.appSlug || 'apps';
const numThumb2Get = 9;
const appOptions = ['app_title_template', 'app_description_template', 'app_content_template', 'cate_title_template', 'cate_description_template', 'apps_title_template', 'apps_description_template', 'apps_content_template', 'games_title_template', 'games_description_template', 'games_content_template', 'dev_title_template', 'dev_description_template',];

// Lấy List Apk choices cho HOME
exports.getApkChoices = async (sortType, curLang, numPage, numSize) => {
  try {
    var offset = numPage * numSize - numSize,
      curLangId = curLang.id,
      apks = {},
      order = [],
      postType = 'post-apk';
    sortType = sortType ? sortType : '';
    switch (sortType) {
      case 'popular':
        order.push(['viewcountweek', 'desc']);
        break;
      case 'new':
        order.push(['publishedat', 'desc']);
        break;
      default:
        order.push(['modifiedat', 'desc']);
        break;
    }
    var ac = await ApkChoice.findOne({ where: { langid: curLangId } });
    var ids = ac && ac.pids ? ac.pids.split(',') : [];
    if (curLang.ismain == true) {
      apks = await Post.findAndCountAll({
        include: [
          /* {
                    model: Category,
                    as: 'developer',
                    where: {
                        catetype: devtype
                    },
                    attributes: ['id', 'title', 'slug'],
                    through: {
                        attributes: []
                    },
                    require: false
                },  */ {
            model: Category,
            as: 'defaultcate',
            attributes: ['id', 'title', 'fullslug'],
            require: false,
          },
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
            required: false,
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text', 'mod_text', 'apk_size'],
            required: false,
          },
        ],
        where: {
          id: {
            [Op.in]: ids,
          },
          posttype: postType,
          poststatus: 'published',
          notenglish: false,
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
        },
        attributes: [
          'id',
          'slug',
          'title',
          'seotitle',
          'publishedat',
          'modifiedat',
          'viewcountweek',
          'likecount',
          'showmodapk',
        ],
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
      });
    } else {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text', 'mod_text', 'apk_size'],
          },
          /* {
                    model: Category,
                    as: 'developer',
                    attributes: ['id', 'title', 'slug'],
                    through: {
                        attributes: []
                    },
                    where: {
                        catetype: devtype
                    },
                    require: false
                },  */ {
            model: Category,
            as: 'defaultcate',
            include: {
              model: CateLang,
              as: 'CateLang',
              attributes: ['title'],
              where: {
                langid: curLang.id,
              },
              required: false,
            },
            attributes: ['id', 'title', 'fullslug'],
          },
          {
            model: PostLang,
            as: 'PostLang',
            where: {
              langid: curLangId,
            },
            attributes: ['title', 'description', 'seodescription', 'seotitle'],
            required: false,
          },
        ],
        attributes: [
          'id',
          'slug',
          'title',
          'seotitle',
          'publishedat',
          'modifiedat',
          'viewcountweek',
          'likecount',
          'showmodapk',
        ],
        where: {
          id: {
            [Op.in]: ids,
          },
          posttype: postType,
          poststatus: 'published',
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
          [Op.or]: {
            islikemain: true,
            [Op.and]: {
              islikemain: false,
              '$PostLang.langid$': curLangId,
            },
          },
        },
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
      });
    }
    var maxPage = Math.ceil(apks.count / numSize);
    apks.curPage = numPage;
    apks.maxPage = maxPage;
    var apps = apks.rows && apks.rows.length > 0 ? functions.sort_apkchoice(apks.rows, ids) : [];
    apks.rows = apps;
    return apks;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// // Hien thi trang danh sach Ringtone, Page
exports.ListPost = async (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actview) {
      return errorController.render403(req, res);
    }
    var posttype = req.params.posttype || '',
      categories = [],
      ejstemplate = 'admin/post';
    const type = await Type.findOne({
      where: {
        id: posttype,
      },
      include: [
        {
          model: Type,
          as: 'catetype',
          attributes: ['id', 'name', 'cateitemtype'],
        },
      ],
    });
    if (type == null) {
      return errorController.render404(req, res);
    }
    const adss = await Ads.findAll({
      where: {
        isblock: false,
      },
      attributes: ['id', 'name'],
    });
    switch (posttype) {
      case 'post-page':
        ejstemplate = 'admin/page';
        break;
      case 'post-ringstone':
        ejstemplate = 'admin/ringtone';
        break;
      case 'post-apk':
        ejstemplate = 'admin/apk';
        break;
      default:
        ejstemplate = 'admin/post';
        break;
    }
    if (type.catetype.length <= 0) {
      return res.render(ejstemplate, { type, categories, adss, posttype });
    }
    var slugcate = [];
    type.catetype.forEach((ct) => {
      if (ct.cateitemtype == 'hierarchy') {
        slugcate.push(ct.id);
      }
    });
    categories = await Category.findAll({
      where: {
        [Op.and]: [
          {
            catetype: {
              [Op.in]: slugcate,
            },
            parentid: {
              [Op.eq]: null,
            },
          },
        ],
      },
      include: [
        {
          model: Category,
          as: 'Childrens',
          attributes: ['id', 'title'],
        },
      ],
    });
    return res.render(ejstemplate, { type, categories, adss, posttype });
  } catch (err) {
    return errorController.render500(req, res);
  }
};

// Hien thi trang danh sach Apk
exports.ListPostApk = async (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actview) {
      return errorController.render403(req, res);
    }
    const posttype = 'post-apk';
    const adss = await Ads.findAll({
      where: {
        isblock: false,
      },
      attributes: ['id', 'name'],
    });
    const categories = await Category.findAll({
      where: {
        catetype: 'category-apk',
        parentid: null,
      },
      attributes: ['id', 'title', 'postcount'],
      include: [
        {
          model: Category,
          as: 'Childrens',
          attributes: ['id', 'title', 'postcount'],
          required: false,
        },
      ],
    });
    res.render('admin/apk', { categories, adss, posttype });
  } catch (err) {
    return errorController.render500(req, res);
  }
};

// Hien thi trang danh sach Blog
exports.ListPostBlog = async (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actview) {
      return errorController.render403(req, res);
    }
    const posttype = 'post-blog';
    const adss = await Ads.findAll({
      where: {
        isblock: false,
      },
      attributes: ['id', 'name'],
    });
    const categories = await Category.findAll({
      where: {
        catetype: 'category-blog',
        parentid: null,
      },
      attributes: ['id', 'title', 'postcount'],
      include: [
        {
          model: Category,
          as: 'Childrens',
          attributes: ['id', 'title', 'postcount'],
          required: false,
        },
      ],
    });
    res.render('admin/blog', { categories, adss, posttype });
  } catch (err) {
    return errorController.render500(req, res);
  }
};

// Hien thi trang add new post
exports.GetAddPost = async (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actadd) {
      return errorController.render403(req, res);
    }
    var posttype = req.params.posttype || '',
      text_render = 'admin/post-add';
    switch (posttype) {
      case 'post-apk':
        text_render = 'admin/apk-add';
        break;
      case 'post-page':
        text_render = 'admin/page-add';
        break;
      default:
        text_render = 'admin/post-add';
    }
    // Loai post dang thuc hien add
    const type = await Type.findOne({
      where: {
        id: posttype,
      },
      attributes: ['id', 'name', 'cateitemtype', 'allowindex', 'allowfollow'],
      include: {
        model: Type,
        as: 'catetype',
        attributes: ['id', 'name', 'cateitemtype', 'allowindex', 'allowfollow'],
        through: {
          attributes: [],
        },
      },
    });
    // Loai postType nay khong ton tai
    if (type == null) {
      return errorController.render404(req, res);
    }
    // Danh sach ngon ngu khac ma site ho tro
    const languages = await Language.findAll({
      where: {
        [Op.and]: {
          isblock: {
            [Op.eq]: false,
          },
          ismain: {
            [Op.eq]: false,
          },
        },
      },
      attributes: ['id', 'name'],
    });
    // Danh sach Ads
    const adss = await Ads.findAll({
      where: {
        isblock: false,
      },
    });
    // postType khong co category
    var categories = [];
    if (type.catetype.length <= 0) {
      return res.render(text_render, { type, categories, languages, adss, posttype });
    }
    var slugcate = [];
    type.catetype.forEach((ct) => {
      if (ct.cateitemtype == 'hierarchy') slugcate.push(ct.id);
    });
    // Danh sach tat ca categories cua postType
    categories = await Category.findAll({
      where: {
        [Op.and]: [
          {
            catetype: {
              [Op.in]: slugcate,
            },
          },
        ],
      },
      attributes: ['id', 'title', 'catetype', 'parentid'],
      raw: true,
    });
    // Tao menu multiple level cho category
    categories = functions.createHierarchy(categories);
    return res.render(text_render, { type, categories, languages, adss, posttype });
  } catch (err) {
    return errorController.render500(req, res);
  }
};

// Hien thi trang edit post
exports.GetEditPost = async (req, res) => {
  try {
    var posttype = req.params.posttype || '',
      id = req.params.id || '';
    (text_render = 'admin/post-edit'), (mlangid = req.mainLang.id || '');
    switch (posttype) {
      case 'post-apk':
        text_render = 'admin/apk-edit';
        break;
      case 'post-page':
        text_render = 'admin/page-edit';
        break;
      default:
        text_render = 'admin/post-edit';
    }
    // Loai post dang sua
    var type = await Type.findOne({
      where: {
        id: posttype,
      },
      include: {
        model: Type,
        as: 'catetype',
        attributes: ['id', 'name', 'cateitemtype'],
      },
    });
    // Loai post khong ton tai
    if (type == null) {
      return errorController.render404(req, res);
    }
    // Post dang sua
    var post = await Post.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'title', 'catetype'],
        },
        {
          model: Apkmeta,
          as: 'apk',
          include: {
            model: Apkmod,
            as: 'mods',
            include: {
              model: Apklink,
              as: 'links',
            },
          },
        },
        {
          model: Apkfaq,
          as: 'faq',
          where: {
            langid: mlangid,
          },
          required: false,
        },
        {
          model: Media,
          as: 'screenshoots',
          attributes: ['id', 'url', 'urlicon'],
        },
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon'],
        },
        {
          model: Media,
          as: 'icon',
          attributes: ['id', 'url', 'urlicon'],
        },
        {
          model: PostLang,
          as: 'PostLang',
          attributes: ['id', 'langid'],
        },
      ],
      order: [
        [{ model: Apkfaq, as: 'faq' }, 'numsort', 'DESC'],
        [{ model: Apkmeta, as: 'apk' }, { model: Apkmod, as: 'mods' }, 'numsort', 'DESC'],
        [
          { model: Apkmeta, as: 'apk' },
          { model: Apkmod, as: 'mods' },
          { model: Apklink, as: 'links' },
          'numsort',
          'DESC',
        ],
      ],
    });
    // Post khong ton tai, chuyen ve trang them post moi
    if (post == null) {
      return res.redirect(`/${dashboard}/post/${posttype}/add`);
    }
    // Check quyen sua hoac author
    if (post.author !== req.session.userid) {
      if (!req.roleAction || !req.roleAction.actedit) {
        return errorController.render403(req, res);
      }
    }
    // Danh sach ngon ngu khac ma site ho tro
    var languages = await Language.findAll({
      where: {
        [Op.and]: {
          isblock: {
            [Op.eq]: false,
          },
          ismain: {
            [Op.eq]: false,
          },
        },
      },
      attributes: ['id', 'name'],
    });
    // Danh sach Ads
    var adss = await Ads.findAll({ where: { isblock: false } });
    var categories = [];
    var slugcate = [];
    // Post type khong co category
    if (type.catetype.length <= 0) {
      return res.render(text_render, { post, type, categories, languages, adss, posttype });
    }
    // Lay nhung categories loai hierarchy hien thi len trang sua
    type.catetype.forEach((ct) => {
      if (ct.cateitemtype == 'hierarchy') slugcate.push(ct.id);
    });
    categories = await Category.findAll({
      where: {
        [Op.and]: [
          {
            catetype: {
              [Op.in]: slugcate,
            },
          },
        ],
      },
      attributes: ['id', 'title', 'catetype', 'parentid'],
      raw: true,
    });
    // Chuyen cac categories sang dang multilple level
    categories = functions.createHierarchy(categories);
    var tracer = await tracerController.getTracking('post', post.id);
    return res.render(text_render, { post, type, categories, languages, adss, posttype, tracer });
  } catch (err) {
    return errorController.render500(req, res);
  }
};

// Lay thong tin post khi update
exports.findOne = async (req, res) => {
  try {
    var id = req.query.id || req.params.id || req.body.id || '',
      posttype = req.params.posttype || '';
    const post = await Post.findOne({
      where: {
        id: id,
        posttype: posttype,
      },
    });
    if (post == null) {
      return res.json({ code: 0, message: 'Post not exist' });
    }
    // Check quyen view hoac la author
    if (post.author !== req.session.userid) {
      if (!req.roleAction || !req.roleAction.actview) {
        return errorController.render403Ajax(req, res);
      }
    }
    return res.json({ code: 1, data });
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};

// New posts submit
exports.AddPost = async (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actadd) {
      return errorController.render403Ajax(req, res);
    }
    var islikemain = req.body.islikemain;
    islikemain = islikemain == 'on' ? true : false;
    var notenglish = req.body.notenglish;
    notenglish = notenglish == 'on' ? true : false;
    var offads = req.body.offads;
    offads = offads == 'on' ? true : false;
    var offadsall = req.body.offadsall;
    offadsall = offadsall == 'on' ? true : false;
    var offadscontent = req.body.offadscontent;
    offadscontent = offadscontent == 'on' ? true : false;
    var offadsdownload = req.body.offadsdownload;
    offadsdownload = offadsdownload == 'on' ? true : false;
    var allowfollow = req.body.allowfollow;
    allowfollow = allowfollow == 'on' ? true : false;
    var allowindex = req.body.allowindex;
    allowindex = allowindex == 'on' ? true : false;
    var showmodapk = req.body.showmodapk;
    showmodapk = showmodapk == 'on' ? true : false;
    var off_update_version = req.body.off_update_version;
    off_update_version = off_update_version == 'on' ? true : false;
    var nolink = req.body.nolink;
    nolink = nolink == 'on' ? true : false;
    var seotitle = req.body.seotitle;
    seotitle =
      seotitle === '' || seotitle === null || seotitle === undefined ? req.body.title : seotitle;
    var seodescription = req.body.seodescription;
    seodescription =
      seodescription === '' || seodescription === null || seodescription === undefined
        ? req.body.description
        : seodescription;
    var slug = req.body.slug;
    if (slug === '' || slug === null || slug === undefined) {
      slug = functions.convert_slug(req.body.title);
    }
    var posttype = req.params['posttype'];
    var adsIdForm = req.body.ads;
    var defaultAds = {};
    if (adsIdForm == '' || adsIdForm == undefined || adsIdForm == null) {
      defaultAds = await Ads.findOne({
        where: {
          isdefault: true,
        },
        attributes: ['id', 'slot1', 'slot2', 'slot3', 'slot4'],
      });
    } else {
      defaultAds = await Ads.findOne({
        where: {
          id: adsIdForm,
        },
        attributes: ['id', 'slot1', 'slot2', 'slot3', 'slot4'],
      });
    }
    defaultAds = defaultAds ? defaultAds : {};
    var adsslot1 = defaultAds.slot1;
    var adsslot2 = defaultAds.slot2;
    var adsslot3 = defaultAds.slot3;
    var adsslot4 = defaultAds.slot4;
    var appTitle = req.body.title || '';
    await Post.create({
      slug: slug,
      title: appTitle,
      description: req.body.description,
      content: req.body.content,
      seotitle: seotitle,
      seodescription: seodescription,
      seoschema: req.body.seoschema || '',
      islikemain: islikemain,
      notenglish: notenglish,
      offads: offads,
      offadsall: offadsall,
      offadscontent: offadscontent,
      offadsdownload: offadsdownload,
      allowfollow: allowfollow,
      allowindex: allowindex,
      showmodapk: showmodapk,
      off_update_version: off_update_version,
      nolink: nolink,
      adsid: defaultAds.id,
      adsslot1: adsslot1,
      adsslot2: adsslot2,
      adsslot3: adsslot3,
      adsslot4: adsslot4,
      poststatus: req.body.poststatus,
      publishedat: req.body.publishedat,
      modifiedat: req.body.publishedat,
      posttype: posttype,
      template: req.body.template || null,
    })
      .then(async (post) => {
        // add log Add
        await tracerController.addTracking(
          req.ipAddr,
          req.userAgent,
          req.session.userid,
          'post',
          post.id,
          'add',
          `Add ${post.title}`
        );
        if (req.body.categories) {
          var cs = req.body.categories || [];
          post.setCategories(cs);
          post.setDefaultcate(cs[0]);
        }
        if (req.session.userid) {
          post.setAuthor(req.session.userid);
        }
        if (req.body.screenshoot) {
          var ss = req.body.screenshoot || [];
          post.setScreenshoots(ss);
        }
        if (req.body.thumb) {
          post.setThumb(req.body.thumb || null);
        }
        if (req.body.imgicon) {
          post.setIcon(req.body.imgicon || null);
        }
        if (req.body.apk) {
          var show_ads_pagedown2 = req.body.apk.show_ads_pagedown2;
          show_ads_pagedown2 = show_ads_pagedown2 == 'on' ? true : false;
          var off_ads_redirect = req.body.apk.off_ads_redirect;
          off_ads_redirect = off_ads_redirect == 'on' ? true : false;
          var off_apk_text = req.body.apk.off_apk_text;
          off_apk_text = off_apk_text == 'on' ? true : false;
          var off_mod_text = req.body.apk.off_mod_text;
          off_mod_text = off_mod_text == 'on' ? true : false;
          var off_mod = req.body.apk.off_mod;
          off_mod = off_mod == 'on' ? true : false;
          var show_slide = req.body.apk.show_slide;
          show_slide = show_slide == 'on' ? true : false;
          var mod_text = req.body.apk.mod_text || '';
          if (mod_text == '') {
            var arrModText = seotitle.match(/\(.+\)/g);
            mod_text = arrModText != null ? arrModText[0].replace(/\(|\)/g, '') : mod_text;
          }
          Apkmeta.create({
            playstore_url: req.body.apk.playstore_url,
            package_name: req.body.apk.package_name,
            developer_name: req.body.apk.developer_name,
            version: req.body.apk.version,
            apk_size: req.body.apk.apk_size,
            price: req.body.apk.price,
            os: req.body.apk.os,
            url_android: req.body.apk.url_android,
            url_ios: req.body.apk.url_ios,
            url_pc: req.body.apk.url_pc,
            recent_changed_text: req.body.apk.recent_changed_text,
            header_image: req.body.apk.off,
            video_review_url: req.body.apk.video_review_url,
            show_ads_pagedown2: show_ads_pagedown2,
            off_ads_redirect: off_ads_redirect,
            off_apk_text: off_apk_text,
            off_mod_text: off_mod_text,
            off_mod: off_mod,
            show_slide: show_slide,
            off_update_version: off_update_version,
            postid: post.id,
            mod_text: mod_text,
          }).then((apk) => {
            if (req.body.mod) {
              var mods = req.body.mod;
              mods.forEach((mod) => {
                var showinsingle = mod.showinsingle;
                showinsingle = showinsingle == 'on' ? true : false;
                var isoriginal = mod.isoriginal;
                isoriginal = isoriginal == 'on' ? true : false;
                var numsort = mod.numsort;
                numsort = parseInt(numsort) || 0;
                Apkmod.create({
                  title: mod.title,
                  description: mod.description,
                  showinsingle: showinsingle,
                  isoriginal: isoriginal,
                  apkid: apk.id,
                  numsort: numsort,
                }).then((modadded) => {
                  if (mod.item) {
                    mod.item.forEach((moditem) => {
                      Apklink.create({
                        title: moditem.title,
                        size: moditem.size,
                        link: moditem.link,
                        modid: modadded.id,
                        numsort: moditem.numsort || 1,
                      });
                    });
                  }
                });
              });
            }
          });
        }
        res.json({ code: 1, message: 'Post was created successfully!', data: post });
      })
      .catch(() => {
        return errorController.render500Ajax(req, res);
      });
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};

// Edit posts submit
exports.EditPost = async (req, res) => {
  try {
    var islikemain = req.body.islikemain;
    islikemain = islikemain == 'on' ? true : false;
    var notenglish = req.body.notenglish;
    notenglish = notenglish == 'on' ? true : false;
    var offads = req.body.offads;
    offads = offads == 'on' ? true : false;
    var offadsall = req.body.offadsall;
    offadsall = offadsall == 'on' ? true : false;
    var offadscontent = req.body.offadscontent;
    offadscontent = offadscontent == 'on' ? true : false;
    var offadsdownload = req.body.offadsdownload;
    offadsdownload = offadsdownload == 'on' ? true : false;
    var allowfollow = req.body.allowfollow;
    allowfollow = allowfollow == 'on' ? true : false;
    var allowindex = req.body.allowindex;
    allowindex = allowindex == 'on' ? true : false;
    var showmodapk = req.body.showmodapk;
    showmodapk = showmodapk == 'on' ? true : false;
    var seotitle = req.body.seotitle;
    seotitle =
      seotitle === '' || seotitle === null || seotitle === undefined ? req.body.title : seotitle;
    var seodescription = req.body.seodescription;
    seodescription =
      seodescription === '' || seodescription === null || seodescription === undefined
        ? req.body.description
        : seodescription;
    var nolink = req.body.nolink;
    nolink = nolink == 'on' ? true : false;
    var off_update_version = req.body.off_update_version;
    off_update_version = off_update_version == 'on' ? true : false;
    var slug = req.body.slug;
    if (slug === '' || slug === null || slug === undefined) {
      slug = functions.convert_slug(req.body.title);
    }
    var thumbid = req.body.thumb;
    thumbid = thumbid == '' || thumbid == undefined ? null : thumbid;
    var iconid = req.body.imgicon;
    iconid = iconid == '' || iconid == undefined ? null : iconid;
    var id = req.body.id;
    const curPost = await Post.findOne({
      where: {
        id,
      },
    });
    if (curPost == null) {
      return errorController.render404Ajax(req, res);
    }
    // Check quyen Edit hoac Author
    if (curPost.author !== req.session.userid) {
      if (!req.roleAction || !req.roleAction.actedit) {
        return errorController.render403Ajax(req, res);
      }
    }
    // auto create redirect page when change slug
    var updateMenuFlag = false;
    if (curPost.islikemain != islikemain) {
      updateMenuFlag = true;
    }
    if (curPost.slug != slug) {
      updateMenuFlag = true;
      var author = req.session.userid ? req.session.userid : null;
      await createRedirectWhenChangeSlug('post', '301', curPost.slug, slug, author);
    }
    var newAdsId = req.body.ads ? req.body.ads : null;
    var slot1 = req.body.adsslot1 ? req.body.adsslot1 : '',
      slot2 = req.body.adsslot2 ? req.body.adsslot2 : '',
      slot3 = req.body.adsslot3 ? req.body.adsslot3 : '',
      slot4 = req.body.adsslot4 ? req.body.adsslot4 : '';
    if (newAdsId != curPost.adsid) {
      const newAds = await Ads.findOne({
        where: {
          id: newAdsId,
        },
        attributes: ['id', 'slot1', 'slot2', 'slot3', 'slot4'],
      });
      if (newAds != null) {
        curPost.setAds(newAdsId);
        slot1 = newAds.slot1;
        slot2 = newAds.slot2;
        slot3 = newAds.slot3;
        slot4 = newAds.slot4;
      }
    }
    var appTitle = req.body.title || '';
    curPost.slug = slug;
    curPost.title = appTitle;
    curPost.description = req.body.description;
    curPost.content = req.body.content;
    curPost.seotitle = seotitle;
    curPost.seodescription = seodescription;
    curPost.seoschema = req.body.seoschema || '';
    curPost.islikemain = islikemain;
    curPost.notenglish = notenglish;
    curPost.offads = offads;
    curPost.offadsall = offadsall;
    curPost.offadscontent = offadscontent;
    curPost.offadsdownload = offadsdownload;
    curPost.allowfollow = allowfollow;
    curPost.allowindex = allowindex;
    curPost.showmodapk = showmodapk;
    curPost.poststatus = req.body.poststatus;
    curPost.publishedat = req.body.publishedat;
    curPost.modifiedat = req.body.modifiedat || new Date();
    curPost.thumbnail = thumbid;
    curPost.imgicon = iconid;
    curPost.adsid = newAdsId;
    curPost.adsslot1 = slot1;
    curPost.adsslot2 = slot2;
    curPost.adsslot3 = slot3;
    curPost.adsslot4 = slot4;
    curPost.nolink = nolink;
    curPost.off_update_version = off_update_version;
    curPost.template = req.body.template || null;
    var cs = req.body.categories || [];
    var ss = req.body.screenshoot || [];
    if (ss.length > 0) {
      var screenshoots = await Media.findAll({
        where: {
          id: ss,
        },
      });
      curPost.setScreenshoots(screenshoots);
    }
    if (cs.length > 0) {
      var categories = await Category.findAll({
        where: {
          id: cs,
        },
      });
      if (!cs.includes(curPost.dcateid)) {
        var dcate = '';
        for (var i = 0; i < categories.length; i++) {
          if (categories[i].catetype == 'category-apk') {
            dcate = categories[i].id;
            break;
          }
        }
        if (dcate != '') {
          curPost.dcateid = dcate;
        }
      }
      curPost.setCategories(categories);
    }
    await curPost.save();
    // add log Edit
    await tracerController.addTracking(
      req.ipAddr,
      req.userAgent,
      req.session.userid,
      'post',
      id,
      'edit',
      `Edit ${req.body.title}`
    );
    var newSlug = curPost.slug;
    var objectlangs = '';
    if (updateMenuFlag) {
      newSlug = slug;
      objectlangs = await Post.findPostLangAvailableFullText(curPost.id);
      // Neu Post la 1 item menu thi update thong tin cua item menu
      await Menuitem.update(
        {
          slug: newSlug,
          objectlangs: objectlangs,
          alllanguage: islikemain,
        },
        {
          where: {
            objectid: curPost.id,
            type: 'post',
          },
        }
      );
    }
    if (req.body.apk) {
      var show_ads_pagedown2 = req.body.apk.show_ads_pagedown2;
      show_ads_pagedown2 = show_ads_pagedown2 == 'on' ? true : false;
      var off_ads_redirect = req.body.apk.off_ads_redirect;
      off_ads_redirect = off_ads_redirect == 'on' ? true : false;
      var off_apk_text = req.body.apk.off_apk_text;
      off_apk_text = off_apk_text == 'on' ? true : false;
      var off_mod_text = req.body.apk.off_mod_text;
      off_mod_text = off_mod_text == 'on' ? true : false;
      var off_mod = req.body.apk.off_mod;
      off_mod = off_mod == 'on' ? true : false;
      var show_slide = req.body.apk.show_slide;
      show_slide = show_slide == 'on' ? true : false;
      var mod_text = req.body.apk.mod_text || '';
      if (mod_text == '') {
        var arrModText = seotitle.match(/\(.+\)/g);
        mod_text = arrModText != null ? arrModText[0].replace(/\(|\)/g, '') : mod_text;
      }
      var apkid = req.body.apk.id;
      var developer_name = req.body.apk.developer_name ? req.body.apk.developer_name : '';
      var developer_slug = functions.convert_slug(developer_name);
      await Apkmeta.update(
        {
          playstore_url: req.body.apk.playstore_url,
          package_name: req.body.apk.package_name,
          developer_name: developer_name,
          developer_slug: developer_slug,
          version: req.body.apk.version,
          apk_size: req.body.apk.apk_size || '',
          price: req.body.apk.price,
          pricetext: req.body.apk.price,
          os: req.body.apk.os,
          url_android: req.body.apk.url_android,
          url_ios: req.body.apk.url_ios,
          url_pc: req.body.apk.url_pc,
          recent_changed_text: req.body.apk.recent_changed_text,
          header_image: req.body.apk.off,
          video_review_url: req.body.apk.video_review_url,
          show_ads_pagedown2: show_ads_pagedown2,
          off_ads_redirect: off_ads_redirect,
          off_apk_text: off_apk_text,
          off_mod_text: off_mod_text,
          off_mod: off_mod,
          show_slide: show_slide,
          off_update_version: off_update_version,
          postid: curPost.id,
          mod_text: mod_text,
        },
        {
          where: {
            id: apkid,
          },
        }
      );
    }
    // vtn add
    var request = require('request');
    // console.log(newSlug);
    //xóa cache proxy
    var options = {
      method: 'GET',
      url: 'https://coimobile.com/purge/' + newSlug + '/',
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);

      if (response.statusCode == 200) {
      }
    });

    //Xoa cache cloudflare
    zoneID = '4198d5f2bc3e9829fd07a0dc977391c6';
    var request = require('request');
    var options = {
      method: 'POST',
      url: 'https://api.cloudflare.com/client/v4/zones/' + zoneID + '/purge_cache',
      headers: {
        'X-Auth-Email': 'shannonwioo865@gmail.com',
        'Content-Type': 'application/json',
        Authorization: 'Bearer Ncjmw1AtYQbHqt1I4jz7a9ZJXrMXhSkahnniMZjs',
      },
      body: JSON.stringify({ files: [{ url: 'https://coimobile.com/' + newSlug + '/' }] }),
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      // console.log(response.body);
    });
    //Xoa cache cloudflare
    // vtn add
    return res.json({ code: 1, message: 'Post was updated successfully' });
  } catch (error) {
    return errorController.render500Ajax(req, res);
  }
};

// Action bulk
exports.BulkPost = async (req, res) => {
  var id = req.body.id,
    action = req.body.action,
    where = {
      id: id,
    };
  if (!req.roleAction || !req.roleAction.actedit) {
    where.author = req.session.userid || '';
  }
  if (action == 'delete') {
    this.DeletePost(req, res);
  } else {
    let status = '';
    switch (action) {
      case 'trash':
        status = 'trash';
        break;
      case 'restore':
        status = 'pending';
        break;
      default:
        status = '';
        break;
    }
    if (status == '') {
      return res.json({ code: 0, message: 'Unkown this bulk action' });
    }
    var rsUpdate = await Post.update(
      {
        poststatus: status,
      },
      {
        where: where,
      }
    );
    if (rsUpdate <= 0) {
      return res.json({ code: 0, message: `Post can't ${action}` });
    }
    var lpost = await Post.findAll({
      where: where,
      attributes: ['id', 'title'],
    });
    // add tracer
    lpost.forEach(async (p) => {
      await tracerController.addTracking(
        req.ipAddr,
        req.userAgent,
        req.session.userid,
        'post',
        p.id,
        action,
        `${action} ${p.title}`
      );
    });
    return res.json({ code: 1, message: `Posts were ${action} successfully` });
  }
};

// Chua dung -> Delete by bulk action -> chua phan quyen
exports.DeletePost = async (req, res) => {
  try {
    var id = req.params.id || req.body.id || req.query.id || '',
      posttype = req.params.posttype || '',
      where = {
        id: id,
        posttype: posttype,
      };
    if (!req.roleAction || !req.roleAction.actdel) {
      where.author = req.session.userid || '';
    }
    var deletePost = await Post.destroy({
      where: where,
    });
    if (deletePost <= 0) {
      return res.json({ code: 0, message: 'Post was deleted error' });
    }
    await Menuitem.destroy({
      where: {
        objectid: id,
        type: 'post',
      },
    });
    await LogApkFile.destroy({
      where: {
        postid: id,
      },
    });
    var lpost = await Post.findAll({
      where: where,
      attributes: ['id', 'title'],
    });
    // add tracer
    lpost.forEach(async (p) => {
      await tracerController.addTracking(
        req.ipAddr,
        req.userAgent,
        req.session.userid,
        'post',
        c.id,
        'delete',
        `Delete ${p.title}`
      );
    });
    return res.json({ code: 1, message: 'Post was deleted successfully' });
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};

// Phan tran cho all posttype
exports.Datatable = async (req, res) => {
  var where = {},
    column = 'id';
  var search = req.query.columns[1].search.value || '%';
  var cateid = req.query.columns[2].search.value;
  cateid = cateid == '' ? '%' : cateid;
  var adsid = req.query.columns[3].search.value;
  adsid = adsid == '' ? '%' : adsid;
  var offadsall = req.query.columns[4].search.value;
  offadsall = offadsall == '' ? '%' : offadsall;
  offadsall = offadsall == 'on' ? false : offadsall;
  offadsall = offadsall == 'off' ? true : offadsall;
  var poststatus = req.query.columns[5].search.value;
  poststatus = poststatus == '' ? '%' : poststatus;
  var posttype = req.params['posttype'];
  var op = [
    {
      posttype: posttype,
    },
  ];
  if (search != '%') {
    var user = await User.findOne({ where: { username: search }, attributes: ['id'] });
    if (user != null) {
      op.push({
        author: user.id,
      });
    } else {
      op.push({
        title: {
          [Op.like]: `%${search}%`,
        },
      });
    }
  }
  if (adsid != '%') {
    op.push({
      adsid: {
        [Op.like]: `${adsid}`,
      },
    });
  }
  if (offadsall != '%') {
    op.push({ offadsall: offadsall });
  }
  if (poststatus != '%') {
    op.push({
      poststatus: {
        [Op.like]: `${poststatus}`,
      },
    });
  }
  where = {
    [Op.and]: op,
  };
  var includeDatatable = [
    {
      model: Ads,
      as: 'Ads',
      attributes: ['id', 'name'],
    },
    {
      model: User,
      as: 'Author',
      attributes: ['id', 'username', 'nickname'],
    },
    {
      model: PostLang,
      as: 'PostLang',
      attributes: ['langid', 'offadslang'],
      required: false,
    },
  ];
  if (cateid != '%') {
    const cateChildIds = await Category.findAllChildIds(cateid);
    cateChildIds.push(cateid);
    includeDatatable.push({
      model: Category,
      as: 'categories',
      attributes: ['id', 'title', 'catetype', 'postcount'],
      where: {
        id: cateChildIds,
      },
      required: true,
    });
  } else {
    includeDatatable.push({
      model: Category,
      as: 'categories',
      attributes: ['id', 'title', 'catetype', 'postcount'],
      required: false,
    });
  }
  var start = Number(req.query.start);
  var length = Number(req.query.length);
  if (req.query.order[0].column == 1) column = 'title';
  if (req.query.order[0].column == 2) column = 'author';
  if (req.query.order[0].column == 3) column = 'adsid';
  if (req.query.order[0].column == 9) column = 'commentcount';
  if (req.query.order[0].column == 10) column = 'modifiedat';
  var type = req.query.order[0].dir;
  var roleAction = req.roleAction ? req.roleAction : [];
  if (Number.isInteger(start) && Number.isInteger(length)) {
    const apks = await Post.findAndCountAll({
      where: where,
      include: includeDatatable,
      attributes: {
        include: [
          [sequelize.literal(`${roleAction.actview ? roleAction.actview : 0}`), 'roleview'],
          [sequelize.literal(`${roleAction.actadd ? roleAction.actadd : 0}`), 'roleadd'],
          [sequelize.literal(`${roleAction.actedit ? roleAction.actedit : 0}`), 'roleedit'],
          [sequelize.literal(`${roleAction.actdel ? roleAction.actdel : 0}`), 'roledel'],
          [sequelize.literal(`${req.session.userid}`), 'mine'],
        ],
      },
      order: [[column, type]],
      offset: start,
      limit: length,
    });
    res.json({ aaData: apks.rows, iTotalDisplayRecords: apks.count, iTotalRecords: apks.count });
  } else {
    res.json({ code: 0, message: 'Error page' });
  }
};

// Phan trang cho Apk
exports.DatatableApk = async (req, res) => {
  var where = {},
    column = 'id';
  var search = req.query.columns[1].search.value || '%';
  var cateid = req.query.columns[2].search.value;
  cateid = cateid == '' ? '%' : cateid;
  var adsid = req.query.columns[3].search.value;
  adsid = adsid == '' ? '%' : adsid;
  var offadsall = req.query.columns[4].search.value;
  offadsall = offadsall == '' ? '%' : offadsall;
  offadsall = offadsall == 'on' ? false : offadsall;
  offadsall = offadsall == 'off' ? true : offadsall;
  var autoupdate = req.query.columns[5].search.value;
  autoupdate = autoupdate == '' ? '%' : autoupdate;
  autoupdate = autoupdate == 'on' ? false : autoupdate;
  autoupdate = autoupdate == 'off' ? true : autoupdate;
  var poststatus = req.query.columns[6].search.value;
  poststatus = poststatus == '' ? '%' : poststatus;
  var posttype = 'post-apk';
  var op = [
    {
      posttype: posttype,
    },
  ];
  if (search != '%') {
    var user = await User.findOne({ where: { username: search }, attributes: ['id'] });
    if (user != null) {
      op.push({
        author: user.id,
      });
    } else {
      op.push({
        title: {
          [Op.like]: `%${search}%`,
        },
      });
    }
  }
  if (adsid != '%') {
    op.push({
      adsid: {
        [Op.like]: `${adsid}`,
      },
    });
  }
  if (offadsall != '%') {
    op.push({ offadsall: offadsall });
  }
  if (poststatus != '%') {
    op.push({
      poststatus: {
        [Op.like]: `${poststatus}`,
      },
    });
  }
  if (autoupdate != '%') {
    op.push({ off_update_version: autoupdate });
  }
  where = {
    [Op.and]: op,
  };
  var includeDatatable = [
    {
      model: Ads,
      as: 'Ads',
      attributes: ['id', 'name'],
    },
    {
      model: User,
      as: 'Author',
      attributes: ['id', 'username', 'nickname'],
    },
    {
      model: Category,
      as: 'developer',
      attributes: ['id', 'title', 'postcount'],
      where: {
        catetype: 'developer-apk',
      },
      required: false,
    },
    {
      model: PostLang,
      as: 'PostLang',
      attributes: ['langid', 'offadslang'],
      required: false,
    },
  ];
  if (cateid != '%') {
    const cateChildIds = await Category.findAllChildIds(cateid);
    cateChildIds.push(cateid);
    includeDatatable.push({
      model: Category,
      as: 'categories',
      attributes: ['id', 'title', 'catetype', 'postcount'],
      where: {
        id: cateChildIds,
        catetype: 'category-apk',
      },
      required: true,
    });
  } else {
    includeDatatable.push({
      model: Category,
      as: 'categories',
      attributes: ['id', 'title', 'catetype', 'postcount'],
      where: {
        catetype: 'category-apk',
      },
      required: false,
    });
  }
  var start = Number(req.query.start);
  var length = Number(req.query.length);
  if (req.query.order[0].column == 0) column = 'id';
  if (req.query.order[0].column == 1) column = 'title';
  if (req.query.order[0].column == 2) column = 'author';
  if (req.query.order[0].column == 5) column = 'adsid';
  if (req.query.order[0].column == 11) column = 'commentcount';
  if (req.query.order[0].column == 12) column = 'modifiedat';
  var type = req.query.order[0].dir;
  var roleAction = req.roleAction ? req.roleAction : {};
  if (Number.isInteger(start) && Number.isInteger(length)) {
    const apks = await Post.findAndCountAll({
      where: where,
      include: includeDatatable,
      attributes: {
        include: [
          [sequelize.literal(`${roleAction.actview ? roleAction.actview : 0}`), 'roleview'],
          [sequelize.literal(`${roleAction.actadd ? roleAction.actadd : 0}`), 'roleadd'],
          [sequelize.literal(`${roleAction.actedit ? roleAction.actedit : 0}`), 'roleedit'],
          [sequelize.literal(`${roleAction.actdel ? roleAction.actdel : 0}`), 'roledel'],
          [sequelize.literal(`${req.session.userid}`), 'mine'],
        ],
      },
      order: [[column, type]],
      offset: start,
      limit: length,
    });
    res.json({ aaData: apks.rows, iTotalDisplayRecords: apks.count, iTotalRecords: apks.count });
  } else {
    res.json({ code: 0, message: 'Error page' });
  }
};

// Phan trang cho blog
exports.DatatableBlog = async (req, res) => {
  var where = {},
    column = 'id';
  var search = req.query.columns[1].search.value || '%';
  var cateid = req.query.columns[2].search.value;
  cateid = cateid == '' ? '%' : cateid;
  var adsid = req.query.columns[3].search.value;
  adsid = adsid == '' ? '%' : adsid;
  var offadsall = req.query.columns[4].search.value;
  offadsall = offadsall == '' ? '%' : offadsall;
  offadsall = offadsall == 'on' ? false : offadsall;
  offadsall = offadsall == 'off' ? true : offadsall;
  var poststatus = req.query.columns[4].search.value;
  poststatus = poststatus == '' ? '%' : poststatus;
  var posttype = 'post-blog';
  var op = [
    {
      posttype: posttype,
    },
  ];
  if (search != '%') {
    var user = await User.findOne({ where: { username: search }, attributes: ['id'] });
    if (user != null) {
      op.push({
        author: user.id,
      });
    } else {
      op.push({
        title: {
          [Op.like]: `%${search}%`,
        },
      });
    }
  }
  if (adsid != '%') {
    op.push({
      adsid: {
        [Op.like]: `${adsid}`,
      },
    });
  }
  if (offadsall != '%') {
    op.push({ offadsall: offadsall });
  }
  if (poststatus != '%') {
    op.push({
      poststatus: {
        [Op.like]: `${poststatus}`,
      },
    });
  }
  where = {
    [Op.and]: op,
  };
  var includeDatatable = [
    {
      model: Ads,
      as: 'Ads',
      attributes: ['id', 'name'],
    },
    {
      model: User,
      as: 'Author',
      attributes: ['id', 'username', 'nickname'],
    },
    {
      model: PostLang,
      as: 'PostLang',
      attributes: ['langid', 'offadslang'],
      required: false,
    },
  ];
  if (cateid != '%') {
    const cateChildIds = await Category.findAllChildIds(cateid);
    cateChildIds.push(cateid);
    includeDatatable.push({
      model: Category,
      as: 'categories',
      attributes: ['id', 'title', 'catetype', 'postcount'],
      where: {
        id: cateChildIds,
        catetype: 'category-blog',
      },
      required: true,
    });
  } else {
    includeDatatable.push({
      model: Category,
      as: 'categories',
      attributes: ['id', 'title', 'catetype', 'postcount'],
      where: {
        catetype: 'category-blog',
      },
      required: false,
    });
  }
  var start = Number(req.query.start);
  var length = Number(req.query.length);
  if (req.query.order[0].column == 1) column = 'title';
  if (req.query.order[0].column == 2) column = 'author';
  if (req.query.order[0].column == 4) column = 'adsid';
  if (req.query.order[0].column == 10) column = 'commentcount';
  if (req.query.order[0].column == 11) column = 'modifiedat';
  var type = req.query.order[0].dir;
  var roleAction = req.roleAction ? req.roleAction : {};
  if (Number.isInteger(start) && Number.isInteger(length)) {
    const apks = await Post.findAndCountAll({
      where: where,
      include: includeDatatable,
      attributes: {
        include: [
          [sequelize.literal(`${roleAction.actview ? roleAction.actview : 0}`), 'roleview'],
          [sequelize.literal(`${roleAction.actadd ? roleAction.actadd : 0}`), 'roleadd'],
          [sequelize.literal(`${roleAction.actedit ? roleAction.actedit : 0}`), 'roleedit'],
          [sequelize.literal(`${roleAction.actdel ? roleAction.actdel : 0}`), 'roledel'],
          [sequelize.literal(`${req.session.userid}`), 'mine'],
        ],
      },
      order: [[column, type]],
      offset: start,
      limit: length,
    });
    res.json({ aaData: apks.rows, iTotalDisplayRecords: apks.count, iTotalRecords: apks.count });
  } else {
    res.json({ code: 0, message: 'Error page' });
  }
};

// Lay thong tin Apk tu Google play -> private, index, follow
exports.ApkLeech = async (req, res) => {
  try {
    // Check quyen Add
    if (!req.roleAction || !req.roleAction.actadd) {
      return errorController.render403Ajax(req, res);
    }
    //var tmp = 'https://play.google.com/store/apps/details?id=com.mojang.minecraftpe';
    var pakageName = functions.get_param_url(req.body.playstore_url, 'id');
    if (pakageName == null) {
      res.json({ code: 0, message: 'This playstore url is wrong' });
      return;
    }
    //var url = `http://gpapi.yopy.io:8282/api/apps/${pakageName}`;
    //http://gpapi.yopy.io:8282/api/apps/com.spotify.music?lang=es
    var url = `${apkleechCf.getinfo}${pakageName}${appConf.langLeech}`;
    var posttype = req.body.posttype;
    const options = {
      method: 'GET',
      uri: url,
      json: true,
    };
    request(options)
      .then(async function (rs) {
        if (rs.appId) {
          const optsRs = await Option.findAll({
            where: {
              metakey: appOptions,
            },
          });
          var optsObj = [];
          optsRs.forEach((opt) => {
            optsObj[`${opt.metakey}`] = opt.metavalue;
          });
          var postTittle = optsObj.app_title_template ? functions.random_app_template(optsObj.app_title_template, rs) : rs.title;
          var postDescription = optsObj.app_description_template ? functions.random_app_template(optsObj.app_description_template, rs) : '';
          var slug = functions.convert_slug(rs.title);
          var catslug = functions.convert_slug(rs.genre);
          var catetype = 'category-apk';
          var parentcate = rs.genreId.toLowerCase();
          var parentcateslug = parentcate.includes('game_') ? gameSlug : appSlug;
          // get default ADS
          const defaultAds = await Ads.findOne({
            where: {
              isdefault: true,
            },
            attributes: ['id', 'slot1', 'slot2', 'slot3', 'slot4'],
          });
          var adsid = null,
            slot1 = (slot2 = slot3 = slot4 = '');
          if (defaultAds != null) {
            adsid = defaultAds.id;
            slot1 = defaultAds.slot1;
            slot2 = defaultAds.slot2;
            slot3 = defaultAds.slot3;
            slot4 = defaultAds.slot4;
          }
          // Danh muc
          const pCategory = await Category.findOne({
            where: { slug: parentcateslug },
            attributes: ['id'],
          });
          var cateBySlug = await Category.findOne({ where: { slug: catslug, catetype: catetype } });
          var fullslug = pCategory ? `${parentcateslug}/${catslug}` : catslug;
          var typeCateApk = await Type.findOne({
            where: {
              id: catetype,
            },
            attributes: ['allowindex', 'allowfollow'],
          });
          if (cateBySlug == null) {
            const seoTitleTemplate = `${parentcateslug.toLowerCase()}_title_template`;
            const seoDescriptionTemplate = `${parentcateslug.toLowerCase()}_description_template`;
            const optisRs = await Option.findAll({
              where: {
                metakey: [seoTitleTemplate, seoDescriptionTemplate],
              },
            });
            var optionsObj = [];
            optisRs.forEach((opt) => {
              optionsObj[`${opt.metakey}`] = opt.metavalue;
            });

            let seoCateTitle = optionsObj[seoTitleTemplate] ? functions.random_app_template(optionsObj[seoTitleTemplate], rs) : rs.genre;
            let seoCateDesc = optionsObj[seoDescriptionTemplate] ? functions.random_app_template(optionsObj[seoDescriptionTemplate], rs) : "";
            cateBySlug = await Category.create({
              slug: catslug,
              fullslug: fullslug,
              title: rs.genre,
              seotitle: seoCateTitle,
              seodescription: seoCateDesc,
              catetype: catetype,
              author: req.session.userid ? req.session.userid : null,
              parentid: pCategory ? pCategory.id : null,
              adsid: adsid,
              adsslot1: slot1,
              adsslot2: slot2,
              adsslot3: slot3,
              adsslot4: slot4,
              hirarchylevel: 2,
              catestatus: 'published',
              allowfollow: typeCateApk ? typeCateApk.allowfollow : false,
              allowindex: typeCateApk ? typeCateApk.allowindex : false,
            });
            await tracerController.addTracking(req.ipAddr, req.userAgent, req.session.userid, 'category', cateBySlug.id, 'add', `Add ${rs.genre}`);
          }
          // Developer
          var dcatslug = functions.convert_slug(rs.developer.devId);
          var dcatettype = 'developer-apk';
          var devBySlug = await Category.findOne({
            where: { slug: dcatslug, catetype: dcatettype },
          });
          var typeDevApk = await Type.findOne({
            where: {
              id: dcatettype,
            },
            attributes: ['allowindex', 'allowfollow'],
          });
          //var devSeoTitle = `Navegue por apps e jogos do ${rs.developer.devId}`;
          //var devSeoDesc = `Você gosta de apps e jogos do ${rs.developer.devId}? Fique à vontade para navegar por outros apps e jogos criados por ele nesta seção. Desfrute de inúmeros aplicativos com uma vibe similar.`;
          let devSeoTitle = optsObj.dev_title_template ? functions.random_app_template(optsObj.dev_title_template, rs) : rs.developer.devId;
          let devSeoDesc = optsObj.dev_description_template ? functions.random_app_template(optsObj.dev_description_template, rs) : rs.developer.devId;
          if (devBySlug == null) {
            devBySlug = await Category.create({
              slug: dcatslug,
              fullslug: dcatslug,
              title: rs.developer.devId,
              seotitle: devSeoTitle,
              seodescription: devSeoDesc,
              catetype: dcatettype,
              author: req.session.userid ? req.session.userid : null,
              adsid: adsid,
              adsslot1: slot1,
              adsslot2: slot2,
              adsslot3: slot3,
              adsslot4: slot4,
              catestatus: 'published',
              allowfollow: typeDevApk ? typeDevApk.allowfollow : false,
              allowindex: typeDevApk ? typeDevApk.allowindex : false,
            });
            await tracerController.addTracking(
              req.ipAddr,
              req.userAgent,
              req.session.userid,
              'category',
              devBySlug.id,
              'add',
              `Add ${rs.developer.devId}`
            );
          }
          var countAppIdExists = await Apkmeta.count({ where: { package_name: rs.appId } });
          if (countAppIdExists <= 0) {
            var appSlugCount = await Post.count({
              where: {
                slug: {
                  [Op.like]: `${slug}%`,
                },
              },
            });
            slug = appSlugCount > 0 ? slug.concat('-', appSlugCount + 1) : slug;
            var typePostApk = await Type.findOne({
              where: {
                id: 'post-apk',
              },
              attributes: ['allowindex', 'allowfollow'],
            });
            const seoTitleTemplate = `${parentcateslug.toLowerCase()}_title_template`;
            const seoDescriptionTemplate = `${parentcateslug.toLowerCase()}_description_template`;
            const optisRs = await Option.findAll({
              where: {
                metakey: [seoTitleTemplate, seoDescriptionTemplate],
              },
            });
            var optionsObj = [];
            optisRs.forEach((opt) => {
              optionsObj[`${opt.metakey}`] = opt.metavalue;
            });
            postTittle = optionsObj[seoTitleTemplate] ? functions.random_app_template(optionsObj[seoTitleTemplate], rs) : rs.genre;
            postDescription = optionsObj[seoDescriptionTemplate] ? functions.random_app_template(optionsObj[seoDescriptionTemplate], rs) : "";
            let postCreated = await Post.create({
              slug: slug,
              title: rs.title,
              description: postDescription,
              content: '',
              seotitle: postTittle,
              seodescription: postDescription,
              poststatus: 'pending',
              publishedat: new Date(),
              modifiedat: new Date(),
              posttype: posttype,
              adsid: adsid,
              adsslot1: slot1,
              adsslot2: slot2,
              adsslot3: slot3,
              adsslot4: slot4,
              author: req.session.userid ? req.session.userid : null,
              allowfollow: typePostApk ? typePostApk.allowfollow : false,
              allowindex: typePostApk ? typePostApk.allowindex : false,
            });
            await tracerController.addTracking(
              req.ipAddr,
              req.userAgent,
              req.session.userid,
              'post',
              postCreated.id,
              'add',
              `Add ${rs.title}`
            );
            var devSlug = rs.developer.devId ? rs.developer.devId : '';
            devSlug = functions.convert_slug(devSlug) || '';
            var androidVersion = rs.androidVersion.toLowerCase();
            androidVersion = androidVersion == 'vary' ? '4.3+' : androidVersion;
            await Apkmeta.create({
              playstore_url: req.body.playstore_url,
              package_name: rs.appId,
              app_name: rs.title,
              price: rs.priceText,
              pricetext: rs.priceText,
              ccy: rs.currency,
              os: androidVersion,
              version: rs.version,
              apk_size: rs.size,
              developer_name: rs.developer.devId,
              developer_slug: devSlug,
              postid: postCreated.id,
            });

            // Load thumbnail
            let thumbnail = await downloadImg(
              rs.headerImage,
              postCreated.title,
              'thumbnail',
              req.session.token
            );
            if (thumbnail.code == 1 && thumbnail.data && thumbnail.data.id) {
              postCreated.setThumb(thumbnail.data.id);
            }

            // Add Icon
            let icon = await downloadImg(rs.icon, postCreated.title, 'icon', req.session.token);
            if (icon.code == 1 && icon.data && icon.data.id) {
              postCreated.setIcon(icon.data.id);
            }

            // Add screenshoots
            let screenshoots = rs.screenshots || [];
            let ssPromise = [];
            screenshoots.forEach(function (url, i) {
              // Lấy tối đa 10 ảnh screenshoots
              if (i > numThumb2Get) return;
              let tmp = downloadImg(
                url,
                `${postCreated.title} ${i}`,
                'screenshoot',
                req.session.token
              );
              ssPromise.push(tmp);
            });

            let listScreenshoots = await Promise.all(ssPromise);
            let ss = listScreenshoots.reduce((arr, screenshoot) => {
              if (screenshoot.code == 1 && screenshoot.data && screenshoot.data.id) {
                return [...arr, screenshoot.data.id];
              }
            }, []);
            if (ss.length) postCreated.setScreenshoots(ss);
            // Random content Apk
            let ssFull = listScreenshoots.reduce((arr, screenshoot) => {
              if (screenshoot.code == 1 && screenshoot.data) {
                return [...arr, screenshoot.data];
              }
            }, []);
            if (parentcateslug == gameSlug) {
              let newPostContent = optsObj.games_content_template ? functions.random_app_template(optsObj.games_content_template, rs, ssFull) : postCreated.content;
              postCreated.content = newPostContent;
              postCreated.setCategories([cateBySlug.id, devBySlug.id]);
              postCreated.setDefaultcate(cateBySlug.id);
              postCreated.save();
              return res.json({ code: 1, message: "Leech successfully", data: postCreated });
            };
            if (parentcateslug == appSlug) {
              let newPostContent = optsObj.apps_content_template ? functions.random_app_template(optsObj.apps_content_template, rs, ssFull) : postCreated.content;
              postCreated.content = newPostContent;
              postCreated.setCategories([cateBySlug.id, devBySlug.id]);
              postCreated.setDefaultcate(cateBySlug.id);
              postCreated.save();
              return res.json({ code: 1, message: "Leech successfully", data: postCreated });
            };

          } else {
            return res.json({ code: 0, message: 'This app is exists' });
          }
        } else {
          return res.json({ code: 0, message: 'This app is not found, please try agian' });
        }
      })
      .catch((err) => {
        console.log(err);
        return res.json({ code: 0, message: "Can't get api, please try agian" });
      });
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};

// Lay thong tin Apk tu Google play -> private, index, follow
exports.ApkReLeech = async (req, res) => {
  try {
    //var tmp = 'https://play.google.com/store/apps/details?id=com.mojang.minecraftpe';
    var pakageName = functions.get_param_url(req.body.playstore_url, 'id');
    var postId = req.body.pid || '';
    if (pakageName == null) {
      return res.json({ code: 0, message: 'This playstore url is wrong' });
    }
    var oldPost = await Post.findOne({
      where: {
        id: postId,
      },
      include: {
        model: Apkmeta,
        as: 'apk',
        where: {
          package_name: pakageName,
        },
        required: true,
      },
    });
    if (oldPost == null) {
      return errorController.render404Ajax(req, res);
    }
    // Check quyen Edit hoac Author
    if (oldPost.author !== req.session.userid) {
      if (!req.roleAction || !req.roleAction.actedit) {
        return errorController.render403Ajax(req, res);
      }
    }
    //var url = `http://gpapi.yopy.io:8282/api/apps/${pakageName}`;
    //?lang=es
    var url = `${apkleechCf.getinfo}${pakageName}${appConf.langLeech}`;
    const options = {
      method: 'GET',
      uri: url,
      json: true,
    };
    request(options)
      .then(async function (rs) {
        if (rs.appId) {
          const optsRs = await Option.findAll({
            where: {
              metakey: appOptions,
            },
          });
          var optsObj = [];
          optsRs.forEach((opt) => {
            optsObj[`${opt.metakey}`] = opt.metavalue;
          });
          //var postTittle = (optsObj.app_title_template) ? functions.random_app_template(optsObj.app_title_template, rs) : rs.title;
          //var postDescription = (optsObj.app_description_template) ? functions.random_app_template(optsObj.app_description_template, rs) : '';
          var catslug = functions.convert_slug(rs.genre);
          var catetype = 'category-apk';
          var parentcate = rs.genreId.toLowerCase();
          var parentcateslug = parentcate.includes('game_') ? gameSlug : appSlug;
          // get default ADS
          const defaultAds = await Ads.findOne({
            where: {
              isdefault: true,
            },
            attributes: ['id', 'slot1', 'slot2', 'slot3', 'slot4'],
          });
          let adsid = null,
            slot1 = '',
            slot2 = '',
            slot3 = '',
            slot4 = '';
          if (defaultAds != null) {
            adsid = defaultAds.id;
            slot1 = defaultAds.slot1;
            slot2 = defaultAds.slot2;
            slot3 = defaultAds.slot3;
            slot4 = defaultAds.slot4;
          }
          // Danh muc
          const pCategory = await Category.findOne({
            where: { slug: parentcateslug },
            attributes: ['id'],
          });
          var cateBySlug = await Category.findOne({ where: { slug: catslug, catetype: catetype } });
          var fullslug = pCategory ? `${parentcateslug}/${catslug}` : catslug;
          var typeCateApk = await Type.findOne({
            where: {
              id: catetype,
            },
            attributes: ['allowindex', 'allowfollow'],
          });
          if (cateBySlug == null) {
            let seoCateTitle = optsObj.cate_title_template
              ? functions.random_app_template(optsObj.cate_title_template, rs)
              : rs.genre;
            let seoCateDesc = optsObj.cate_description_template
              ? functions.random_app_template(optsObj.cate_description_template, rs)
              : '';
            cateBySlug = await Category.create({
              slug: catslug,
              fullslug: fullslug,
              title: rs.genre,
              seotitle: seoCateTitle,
              seodescription: seoCateDesc,
              catetype: catetype,
              author: req.session.userid ? req.session.userid : null,
              parentid: pCategory ? pCategory.id : null,
              adsid: adsid,
              adsslot1: slot1,
              adsslot2: slot2,
              adsslot3: slot3,
              adsslot4: slot4,
              hirarchylevel: 2,
              catestatus: 'published',
              allowfollow: typeCateApk ? typeCateApk.allowfollow : false,
              allowindex: typeCateApk ? typeCateApk.allowindex : false,
            });
            await tracerController.addTracking(
              req.ipAddr,
              req.userAgent,
              req.session.userid,
              'category',
              cateBySlug.id,
              'add',
              `Add ${rs.genre}`
            );
          }
          // Developer
          var dcatslug = functions.convert_slug(rs.developer.devId);
          var dcatettype = 'developer-apk';
          var devBySlug = await Category.findOne({
            where: { slug: dcatslug, catetype: dcatettype },
          });
          var typeDevApk = await Type.findOne({
            where: {
              id: dcatettype,
            },
            attributes: ['allowindex', 'allowfollow'],
          });
          // var devSeoTitle = `Navegue por apps e jogos do ${rs.developer.devId}`;
          // var devSeoDesc = `Você gosta de apps e jogos do ${rs.developer.devId}? Fique à vontade para navegar por outros apps e jogos criados por ele nesta seção. Desfrute de inúmeros aplicativos com uma vibe similar.`;
          let devSeoTitle = optsObj.dev_title_template
            ? functions.random_app_template(optsObj.dev_title_template, rs)
            : rs.developer.devId;
          let devSeoDesc = optsObj.dev_description_template
            ? functions.random_app_template(optsObj.dev_description_template, rs)
            : rs.developer.devId;
          if (devBySlug == null) {
            devBySlug = await Category.create({
              slug: dcatslug,
              fullslug: dcatslug,
              title: rs.developer.devId,
              seotitle: devSeoTitle,
              seodescription: devSeoDesc,
              catetype: dcatettype,
              author: req.session.userid ? req.session.userid : null,
              adsid: adsid,
              adsslot1: slot1,
              adsslot2: slot2,
              adsslot3: slot3,
              adsslot4: slot4,
              catestatus: 'published',
              allowfollow: typeDevApk ? typeDevApk.allowfollow : false,
              allowindex: typeDevApk ? typeDevApk.allowindex : false,
            });
            await tracerController.addTracking(
              req.ipAddr,
              req.userAgent,
              req.session.userid,
              'category',
              devBySlug.id,
              'add',
              `Add ${rs.developer.devId}`
            );
          }
          var devSlug = rs.developer.devId ? rs.developer.devId : '';
          devSlug = functions.convert_slug(devSlug) || '';
          var androidVersion = rs.androidVersion.toLowerCase();
          androidVersion = androidVersion == 'vary' ? '4.3+' : androidVersion;
          // Gan gia tri moi cho post khi releech
          oldPost.title = rs.title;
          //oldPost.description = postDescription;
          //oldPost.seotitle = postTittle;
          //oldPost.seodescription = postDescription;
          oldPost.modifiedat = new Date();
          oldPost.setCategories([cateBySlug.id, devBySlug.id]);
          oldPost.setDefaultcate(cateBySlug.id);

          // Add Icon
          let icon = await downloadImg(rs.icon, oldPost.title, 'icon', req.session.token);
          if (icon.code == 1 && icon.data && icon.data.id) {
            oldPost.setIcon(icon.data.id);
          }

          // ReLeech none change Screenshoots
          // Add screenshoots
          // let screenshoots = rs.screenshots || [];
          // let ssPromise = [];
          // screenshoots.forEach(function (url, i) {
          //   // Lấy tối đa 10 ảnh screenshoots
          //   if (i > numThumb2Get) return;
          //   let tmp = downloadImg(url, `${oldPost.title} ${i}`, 'screenshoot', req.session.token);
          //   ssPromise.push(tmp);
          // });

          // let listScreenshoots = await Promise.all(ssPromise);
          // let ss = listScreenshoots.reduce((arr, screenshoot) => {
          //   if (screenshoot.code == 1 && screenshoot.data && screenshoot.data.id) {
          //     return [...arr, screenshoot.data.id];
          //   }
          // }, []);

          // if (ss.length) oldPost.setScreenshoots(ss);
          oldPost.save();
          await Apkmeta.update(
            {
              package_name: rs.appId || '',
              app_name: rs.title || '',
              price: rs.priceText || '',
              pricetext: rs.priceText || '',
              ccy: rs.currency || '',
              os: androidVersion,
              version: rs.version || '',
              apk_size: rs.size || '',
              developer_name: rs.developer.devId || '',
              developer_slug: devSlug,
            },
            {
              where: {
                id: oldPost.apk.id,
              },
            }
          );

          await tracerController.addTracking(
            req.ipAddr,
            req.userAgent,
            req.session.userid,
            'post',
            oldPost.id,
            'edit',
            `Releech ${rs.title}`
          );
          return res.json({ code: 1, message: 'Releech successfully' });
        } else {
          return res.json({ code: 0, message: 'This app is not found, please try agian' });
        }
      })
      .catch((err) => {
        console.log(err);
        return res.json({ code: 0, message: "Can't get api, please try agian" });
      });
  } catch (err) {
    console.log('🚀 ~ file: post.controller.js ~ line 2167 ~ exports.ApkReLeech= ~ err', err);

    return errorController.render500Ajax(req, res);
  }
};

// Lấy List Apk theo danh mục cụ thể -> sortType = trending / new / popular CateIds = [cateid, cateid]
exports.getApkByCateIdsLangHasSort = async (sortType, CateIds, curLang, numPage, numSize) => {
  try {
    var offset = numPage * numSize - numSize,
      curLangId = curLang.id,
      apks = {},
      order = [],
      catetype = 'category-apk',
      devtype = 'developer-apk',
      postType = 'post-apk',
      cateWhere = {
        catetype: [catetype, devtype],
      };
    if (CateIds !== '%') {
      cateWhere = {
        catetype: [catetype, devtype],
        id: CateIds,
      };
    }
    switch (sortType) {
      case 'popular':
        order.push(['viewcountweek', 'desc']);
        break;
      case 'new':
        order.push(['publishedat', 'desc']);
        break;
      default:
        order.push(['modifiedat', 'desc']);
        break;
    }
    if (curLang.ismain == true) {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Category,
            as: 'categories',
            where: cateWhere,
            attributes: [],
            through: {
              attributes: [],
            },
            required: true,
          },
          {
            model: Category,
            as: 'developer',
            where: {
              catetype: devtype,
            },
            attributes: ['id', 'title', 'slug'],
            through: {
              attributes: [],
            },
            require: false,
          },
          {
            model: Category,
            as: 'defaultcate',
            attributes: ['id', 'title', 'fullslug'],
            require: false,
          },
          {
            model: Media,
            as: 'icon',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
            required: false,
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text', 'mod_text', 'apk_size'],
            required: false,
          },
        ],
        where: {
          posttype: postType,
          poststatus: 'published',
          notenglish: false,
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
        },
        attributes: [
          'id',
          'slug',
          'title',
          'seotitle',
          'publishedat',
          'modifiedat',
          'viewcountweek',
          'likecount',
          'showmodapk',
        ],
        order: order,
        offset: offset,
        limit: numSize,
        //subQuery: false,
        //logging: console.log
      });
    } else {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Media,
            as: 'icon',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text', 'mod_text', 'apk_size'],
          },
          {
            model: Category,
            as: 'developer',
            attributes: ['id', 'title', 'slug'],
            through: {
              attributes: [],
            },
            where: {
              catetype: devtype,
            },
            require: false,
          },
          {
            model: Category,
            as: 'categories',
            attributes: [],
            through: {
              attributes: [],
            },
            where: cateWhere,
            required: true,
          },
          {
            model: Category,
            as: 'defaultcate',
            include: {
              model: CateLang,
              as: 'CateLang',
              attributes: ['title'],
              where: {
                langid: curLang.id,
              },
              required: false,
            },
            attributes: ['id', 'title', 'fullslug'],
          },
          {
            model: PostLang,
            as: 'PostLang',
            where: {
              langid: curLangId,
            },
            attributes: ['title', 'description', 'seodescription', 'seotitle'],
            required: false,
          },
        ],
        attributes: [
          'id',
          'slug',
          'title',
          'seotitle',
          'publishedat',
          'modifiedat',
          'viewcountweek',
          'likecount',
          'showmodapk',
        ],
        where: {
          posttype: postType,
          poststatus: 'published',
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
          [Op.or]: {
            islikemain: true,
            [Op.and]: {
              islikemain: false,
              '$PostLang.langid$': curLangId,
            },
          },
        },
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
        //logging: console.log
      });
    }
    var maxPage = Math.ceil(apks.count / numSize);
    apks.curPage = numPage;
    apks.maxPage = maxPage;
    return apks;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Lấy List Posts theo danh mục cụ thể -> sortType = trending / new / popular CateIds = [cateid, cateid]
exports.getAllPostByCateIdsLangHasSort = async (sortType, CateIds, curLang, numPage, numSize) => {
  try {
    var offset = numPage * numSize - numSize,
      curLangId = curLang.id,
      apks = {},
      order = [],
      cateWhere = {};
    if (CateIds !== '%') {
      cateWhere = {
        id: CateIds,
      };
    }
    switch (sortType) {
      case 'popular':
        order.push(['viewcountweek', 'desc']);
        break;
      case 'new':
        order.push(['publishedat', 'desc']);
        break;
      default:
        order.push(['modifiedat', 'desc']);
        break;
    }
    if (curLang.ismain == true) {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Category,
            as: 'categories',
            where: cateWhere,
            attributes: [],
            through: {
              attributes: [],
            },
            required: true,
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text', 'mod_text'],
            required: false,
          },
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url'],
            required: false,
          },
        ],
        where: {
          poststatus: 'published',
          notenglish: false,
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
        },
        attributes: [
          'id',
          'slug',
          'title',
          'seotitle',
          'posttype',
          'publishedat',
          'modifiedat',
          'viewcountweek',
          'likecount',
          'showmodapk',
        ],
        order: order,
        offset: offset,
        limit: numSize,
        //logging: console.log
      });
    } else {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text', 'mod_text'],
          },
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url'],
            required: false,
          },
          {
            model: Category,
            as: 'categories',
            attributes: [],
            through: {
              attributes: [],
            },
            where: cateWhere,
            required: true,
          },
          {
            model: PostLang,
            as: 'PostLang',
            where: {
              langid: curLangId,
            },
            attributes: ['title', 'description', 'seodescription', 'seotitle'],
            required: false,
          },
        ],
        attributes: [
          'id',
          'slug',
          'title',
          'seotitle',
          'posttype',
          'publishedat',
          'modifiedat',
          'viewcountweek',
          'likecount',
          'showmodapk',
        ],
        where: {
          poststatus: 'published',
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
          [Op.or]: {
            islikemain: true,
            [Op.and]: {
              islikemain: false,
              '$PostLang.langid$': curLangId,
            },
          },
        },
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
      });
    }
    var maxPage = Math.ceil(apks.count / numSize);
    apks.curPage = numPage;
    apks.maxPage = maxPage;
    return apks;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Lấy List Apk tất cả danh mục -> sortType = trending / new / popular
exports.getApkByLangHasSort = async (sortType, curLang, numPage, numSize) => {
  try {
    var offset = numPage * numSize - numSize,
      curLangId = curLang.id,
      apks = {},
      order = [],
      //catetype = "category-apk",
      devtype = 'developer-apk',
      postType = 'post-apk';
    switch (sortType) {
      case 'popular':
        order.push(['viewcountweek', 'desc']);
        break;
      case 'trending':
        order.push(['viewcountday', 'desc']);
        break;
      default:
        order.push(['modifiedat', 'desc']);
        break;
    }
    if (curLang.ismain == true) {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Category,
            as: 'developer',
            where: {
              catetype: devtype,
            },
            attributes: ['id', 'title', 'slug'],
            through: {
              attributes: [],
            },
            require: false,
          },
          {
            model: Category,
            as: 'defaultcate',
            attributes: ['id', 'title', 'fullslug'],
            require: false,
          },
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
            required: false,
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text'],
            required: false,
          },
        ],
        where: {
          posttype: postType,
          poststatus: 'published',
          notenglish: false,
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
        },
        attributes: [
          'id',
          'slug',
          'title',
          'seotitle',
          'publishedat',
          'modifiedat',
          'viewcountweek',
          'likecount',
          'showmodapk',
        ],
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
        //logging: console.log
      });
    } else {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text'],
          },
          {
            model: Category,
            as: 'developer',
            attributes: ['id', 'title', 'slug'],
            through: {
              attributes: [],
            },
            where: {
              catetype: devtype,
            },
            require: false,
          },
          {
            model: Category,
            as: 'defaultcate',
            include: {
              model: CateLang,
              as: 'CateLang',
              attributes: ['title'],
              where: {
                langid: curLang.id,
              },
              required: false,
            },
            attributes: ['id', 'title', 'fullslug'],
          },
          {
            model: PostLang,
            as: 'PostLang',
            where: {
              langid: curLangId,
            },
            attributes: ['title', 'description', 'seodescription', 'seotitle'],
            required: false,
          },
        ],
        attributes: [
          'id',
          'slug',
          'title',
          'seotitle',
          'publishedat',
          'modifiedat',
          'viewcountweek',
          'likecount',
          'showmodapk',
        ],
        where: {
          posttype: postType,
          poststatus: 'published',
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
          [Op.or]: {
            islikemain: true,
            [Op.and]: {
              islikemain: false,
              '$PostLang.langid$': curLangId,
            },
          },
        },
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
        //logging: console.log
      });
    }
    var maxPage = Math.ceil(apks.count / numSize);
    apks.curPage = numPage;
    apks.maxPage = maxPage;
    return apks;
  } catch (error) {
    console.log(error);
    return [];
  }
};
// Lấy List Post theo danh mục -> sortType = trending / new / popular
exports.getPostByCateIdsLangHasSort = async (
  sortType,
  cateType,
  CateIds,
  curLang,
  numPage,
  numSize
) => {
  try {
    var offset = numPage * numSize - numSize,
      curLangId = curLang.id,
      apks = {},
      order = [],
      cateWhere = {
        catetype: cateType,
      };
    if (Array.isArray(CateIds)) {
      cateWhere = {
        catetype: cateType,
        id: CateIds,
      };
    }
    switch (sortType) {
      case 'popular':
        order.push(['viewcountweek', 'desc']);
        break;
      case 'trending':
        order.push(['viewcountday', 'desc']);
        break;
      default:
        order.push(['modifiedat', 'desc']);
        break;
    }
    if (curLang.ismain == true) {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: User,
            as: 'Author',
            attributes: ['id', 'firstname', 'lastname'],
          },
          {
            model: Category,
            as: 'categories',
            where: cateWhere,
            attributes: [],
            through: {
              attributes: [],
            },
            required: true,
          },
        ],
        where: {
          //posttype: postType,
          poststatus: 'published',
          notenglish: false,
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
        },
        attributes: ['id', 'slug', 'title', 'seotitle', 'description', 'publishedat', 'modifiedat'],
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
        //logging: console.log
      });
    } else {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: PostLang,
            as: 'PostLang',
            where: {
              langid: curLangId,
            },
            attributes: ['title', 'description', 'seodescription', 'seotitle'],
            required: false,
          },
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: User,
            as: 'Author',
            attributes: ['id', 'firstname', 'lastname', 'nickname'],
          },
          {
            model: Category,
            as: 'categories',
            attributes: [],
            through: {
              attributes: [],
            },
            where: cateWhere,
            required: true,
          },
        ],
        attributes: ['id', 'slug', 'title', 'seotitle', 'description', 'publishedat', 'modifiedat'],
        where: {
          //posttype: postType,
          poststatus: 'published',
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
          [Op.or]: {
            islikemain: true,
            [Op.and]: {
              islikemain: false,
              '$PostLang.langid$': curLangId,
            },
          },
        },
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
        //logging: console.log
      });
    }
    var maxPage = Math.ceil(apks.count / numSize);
    apks.curPage = numPage;
    apks.maxPage = maxPage;
    return apks;
  } catch (error) {
    console.log(error);
    return [];
  }
};
// Lấy List Post theo danh mục
exports.getRelatedApk = async (sortType, postId, cateId, curLang, numPage, numSize) => {
  try {
    var offset = numPage * numSize - numSize,
      curLangId = curLang.id,
      apks = {},
      order = [],
      cateWhere = {
        id: cateId,
      };
    switch (sortType) {
      case 'popular':
        order.push(['viewcountweek', 'desc']);
        break;
      case 'trending':
        order.push(['viewcountday', 'desc']);
        break;
      default:
        order.push(['modifiedat', 'desc']);
        break;
    }
    if (curLang.ismain == true) {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Media,
            as: 'icon',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          /* {
                    model: User,
                    as: 'Author',
                    attributes: ['id', 'firstname', 'lastname']
                },  */ {
            model: Category,
            as: 'categories',
            where: cateWhere,
            attributes: [],
            through: {
              attributes: [],
            },
            required: true,
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text', 'mod_text', 'apk_size'],
            required: false,
          } /* , {
                    model: Category,
                    as: 'developer',
                    attributes: ['id', 'title', 'slug'],
                    through: {
                        attributes: []
                    },
                    where: {
                        catetype: 'developer-apk'
                    },
                    require: false
                } */,
        ],
        where: {
          id: {
            [Op.notLike]: postId,
          },
          poststatus: 'published',
          notenglish: false,
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
        },
        attributes: ['id', 'slug', 'title', 'seotitle', 'publishedat', 'modifiedat'],
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
      });
    } else {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: PostLang,
            as: 'PostLang',
            where: {
              langid: curLangId,
            },
            attributes: ['title', 'description', 'seodescription', 'seotitle'],
            required: false,
          },
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          /* {
                    model: User,
                    as: 'Author',
                    attributes: ['id', 'firstname', 'lastname']
                },  */ {
            model: Category,
            as: 'categories',
            attributes: [],
            through: {
              attributes: [],
            },
            where: cateWhere,
            required: true,
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text', 'mod_text', 'apk_size'],
            required: false,
          } /* , {
                    model: Category,
                    as: 'developer',
                    attributes: ['id', 'title', 'slug'],
                    through: {
                        attributes: []
                    },
                    where: {
                        catetype: 'developer-apk'
                    },
                    require: false
                } */,
        ],
        attributes: ['id', 'slug', 'title', 'seotitle', 'publishedat', 'modifiedat'],
        where: {
          id: {
            [Op.notLike]: postId,
          },
          poststatus: 'published',
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
          [Op.or]: {
            islikemain: true,
            [Op.and]: {
              islikemain: false,
              '$PostLang.langid$': curLangId,
            },
          },
        },
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
      });
    }
    var maxPage = Math.ceil(apks.count / numSize);
    apks.curPage = numPage;
    apks.maxPage = maxPage;
    return apks;
  } catch (error) {
    console.log(error);
    return [];
  }
};
// Lấy List Post theo danh mục
exports.getRelatedPost = async (sortType, postId, cateId, curLang, numPage, numSize) => {
  try {
    var offset = numPage * numSize - numSize,
      curLangId = curLang.id,
      apks = {},
      order = [],
      cateWhere = {
        id: cateId,
      };
    switch (sortType) {
      case 'popular':
        order.push(['viewcountweek', 'desc']);
        break;
      case 'trending':
        order.push(['viewcountday', 'desc']);
        break;
      default:
        order.push(['modifiedat', 'desc']);
        break;
    }
    if (curLang.ismain == true) {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: User,
            as: 'Author',
            attributes: ['id', 'firstname', 'lastname', 'nickname'],
          },
          {
            model: Category,
            as: 'categories',
            where: cateWhere,
            attributes: [],
            through: {
              attributes: [],
            },
            required: true,
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text'],
            required: false,
          },
        ],
        where: {
          id: {
            [Op.notLike]: postId,
          },
          poststatus: 'published',
          notenglish: false,
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
        },
        attributes: ['id', 'slug', 'title', 'seotitle', 'description', 'publishedat', 'modifiedat'],
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
      });
    } else {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: PostLang,
            as: 'PostLang',
            where: {
              langid: curLangId,
            },
            attributes: ['title', 'description', 'seodescription', 'seotitle'],
            required: false,
          },
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: User,
            as: 'Author',
            attributes: ['id', 'firstname', 'lastname', 'nickname'],
          },
          {
            model: Category,
            as: 'categories',
            attributes: [],
            through: {
              attributes: [],
            },
            where: cateWhere,
            required: true,
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text'],
            required: false,
          },
        ],
        attributes: ['id', 'slug', 'title', 'seotitle', 'description', 'publishedat', 'modifiedat'],
        where: {
          id: {
            [Op.notLike]: postId,
          },
          poststatus: 'published',
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
          [Op.or]: {
            islikemain: true,
            [Op.and]: {
              islikemain: false,
              '$PostLang.langid$': curLangId,
            },
          },
        },
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
      });
    }
    var maxPage = Math.ceil(apks.count / numSize);
    apks.curPage = numPage;
    apks.maxPage = maxPage;
    return apks;
  } catch (error) {
    console.log(error);
    return [];
  }
};
// Lấy List Post tất cả danh mục của 1 Posttype -> sortType = trending / new / popular
exports.getPostByLangHasSort = async (sortType, postType, curLang, numPage, numSize) => {
  try {
    var offset = numPage * numSize - numSize,
      curLangId = curLang.id,
      apks = {},
      order = [];
    switch (sortType) {
      case 'popular':
        order.push(['viewcountweek', 'desc']);
        break;
      case 'new':
        order.push(['publishedat', 'desc']);
        break;
      default:
        order.push(['modifiedat', 'desc']);
        break;
    }
    if (curLang.ismain == true) {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: User,
            as: 'Author',
            attributes: ['id', 'firstname', 'lastname', 'nickname'],
          },
        ],
        where: {
          posttype: postType,
          poststatus: 'published',
          notenglish: false,
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
        },
        attributes: [
          'id',
          'slug',
          'title',
          'description',
          'seodescription',
          'seotitle',
          'publishedat',
          'modifiedat',
        ],
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
        //logging: console.log
      });
    } else {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: PostLang,
            as: 'PostLang',
            where: {
              langid: curLangId,
            },
            attributes: ['title', 'description', 'seodescription', 'seotitle'],
            required: false,
          },
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: User,
            as: 'Author',
            attributes: ['id', 'firstname', 'lastname', 'nickname'],
          },
        ],
        attributes: [
          'id',
          'slug',
          'title',
          'description',
          'seodescription',
          'seotitle',
          'publishedat',
          'modifiedat',
        ],
        where: {
          posttype: postType,
          poststatus: 'published',
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
          [Op.or]: {
            islikemain: true,
            [Op.and]: {
              islikemain: false,
              '$PostLang.langid$': curLangId,
            },
          },
        },
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
        //logging: console.log
      });
    }
    var maxPage = Math.ceil(apks.count / numSize);
    apks.curPage = numPage;
    apks.maxPage = maxPage;
    return apks;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// dung cho search ca apk va blog
exports.getPostSearch = async (postTitle, curLang, numPage, numSize) => {
  try {
    var offset = numPage * numSize - numSize,
      curLangId = curLang.id,
      apks = {},
      order = [['viewcount', 'DESC']];
    if (curLang.ismain == true) {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text', 'mod_text', 'apk_size'],
            required: false,
          },
        ],
        where: {
          title: {
            [Op.like]: `%${postTitle}%`,
          },
          posttype: ['post-apk', 'post-blog'],
          poststatus: 'published',
          notenglish: false,
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
        },
        attributes: [
          'id',
          'slug',
          'title',
          'seotitle',
          'publishedat',
          'modifiedat',
          'posttype',
          'ratingaverage',
        ],
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
        //logging: console.log
      });
    } else {
      apks = await Post.findAndCountAll({
        include: [
          {
            model: PostLang,
            as: 'PostLang',
            where: {
              langid: curLangId,
            },
            attributes: ['title', 'description', 'seodescription', 'seotitle'],
            required: false,
          },
          {
            model: Media,
            as: 'thumb',
            attributes: ['id', 'url', 'urlicon', 'childsizes'],
          },
          {
            model: Apkmeta,
            as: 'apk',
            attributes: ['version', 'off_mod_text', 'off_apk_text', 'mod_text', 'apk_size'],
            required: false,
          },
        ],
        attributes: [
          'id',
          'slug',
          'title',
          'seotitle',
          'publishedat',
          'modifiedat',
          'showmodapk',
          'ratingaverage',
        ],
        where: {
          title: {
            [Op.like]: `%${postTitle}%`,
          },
          posttype: ['post-apk', 'post-blog'],
          poststatus: 'published',
          publishedat: {
            [Op.lte]: sequelize.fn('NOW'),
          },
          [Op.or]: {
            islikemain: true,
            [Op.and]: {
              islikemain: false,
              '$PostLang.langid$': curLangId,
            },
          },
        },
        order: order,
        offset: offset,
        limit: numSize,
        subQuery: false,
        //logging: console.log
      });
    }
    var maxPage = Math.ceil(apks.count / numSize);
    apks.curPage = numPage;
    apks.maxPage = maxPage;
    return apks;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Lấy category ringtones (post-ringtone)
exports.getRingtoneCatesByLang = async (curLang) => {
  var curLangId = curLang.id;
  var postType = 'post-ringstone';
  var posts = [];
  if (curLang.ismain == true) {
    posts = await Post.findAll({
      where: {
        posttype: postType,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
      },
      attributes: ['id', 'slug', 'title'],
      //order: sequelize.literal('rand()')
    });
  } else {
    posts = await Post.findAll({
      include: [
        {
          model: PostLang,
          as: 'PostLang',
          where: {
            langid: curLangId,
          },
          attributes: ['title', 'description', 'seodescription', 'seotitle'],
          required: false,
        },
      ],
      where: {
        posttype: postType,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$PostLang.langid$': curLangId,
          },
        },
      },
      attributes: ['id', 'slug', 'title'],
      //order: sequelize.literal('rand()'),
      subQuery: false,
    });
  }
  posts = posts == null ? [] : posts;
  return posts;
};

// Lấy post by lang and slug
exports.getPostByLangAndSlug = async (slug, curLang) => {
  var curLangId = curLang.id;
  var post = {};
  if (curLang.ismain == true) {
    post = await Post.findOne({
      include: [
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'firstname', 'lastname', 'avatar', 'nickname'],
        },
        {
          model: Category,
          as: 'defaultcate',
          attributes: ['id', 'title', 'fullslug'],
          require: false,
        },
      ],
      where: {
        slug: slug,
        nolink: false,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
      },
    });
  } else {
    post = await Post.findOne({
      include: [
        {
          model: PostLang,
          as: 'PostLang',
          where: {
            langid: curLangId,
          },
          required: false,
        },
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'firstname', 'lastname', 'avatar', 'nickname'],
        },
        {
          model: Category,
          as: 'defaultcate',
          attributes: ['id', 'title', 'fullslug'],
          require: false,
        },
      ],
      where: {
        slug: slug,
        nolink: false,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$PostLang.langid$': curLangId,
          },
        },
      },
      subQuery: false,
      //logging: console.log
    });
  }
  return post;
};

// Lấy post by lang and slug
exports.getPostByLangAndSlugExtension = async (slug, curLang, extention) => {
  var curLangId = curLang.id;
  var post = {};
  var types = await Type.findAll({
    where: {
      type: 'post',
      exttext: extention,
      isblock: false,
    },
    attributes: ['id'],
    raw: true,
  });
  var arrExt = [];
  types
    ? types.map((t) => {
      arrExt.push(t.id);
    })
    : [];
  if (curLang.ismain == true) {
    post = await Post.findOne({
      include: [
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Media,
          as: 'icon',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'firstname', 'lastname', 'avatar', 'nickname'],
        },
        {
          model: Category,
          as: 'defaultcate',
          attributes: ['id', 'title', 'fullslug'],
          require: false,
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        slug: slug,
        posttype: arrExt,
        nolink: false,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
      },
    });
  } else {
    post = await Post.findOne({
      include: [
        {
          model: PostLang,
          as: 'PostLang',
          where: {
            langid: curLangId,
          },
          required: false,
        },
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Media,
          as: 'icon',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'firstname', 'lastname', 'avatar', 'nickname'],
        },
        {
          model: Category,
          as: 'defaultcate',
          attributes: ['id', 'title', 'fullslug'],
          require: false,
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        slug: slug,
        posttype: arrExt,
        nolink: false,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$PostLang.langid$': curLangId,
          },
        },
      },
      subQuery: false,
      //logging: console.log
    });
  }
  return post;
};

// Lấy post by lang and slug
exports.getPostPreViewMode = async (postId, curLang) => {
  var curLangId = curLang.id;
  var post = {};
  if (curLang.ismain == true) {
    post = await Post.findOne({
      include: [
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'firstname', 'lastname', 'avatar', 'nickname'],
        },
        {
          model: Category,
          as: 'defaultcate',
          attributes: ['id', 'title', 'fullslug'],
          require: false,
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        id: postId,
        nolink: false,
      },
    });
  } else {
    post = await Post.findOne({
      include: [
        {
          model: PostLang,
          as: 'PostLang',
          where: {
            langid: curLangId,
          },
          required: false,
        },
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'firstname', 'lastname', 'avatar', 'nickname'],
        },
        {
          model: Category,
          as: 'defaultcate',
          attributes: ['id', 'title', 'fullslug'],
          require: false,
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        id: postId,
        nolink: false,
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$PostLang.langid$': curLangId,
          },
        },
      },
      subQuery: false,
      //logging: console.log
    });
  }
  return post;
};

// Lấy post by lang and id
exports.getApkInDownloadPage = async (postId, curLang) => {
  var curLangId = curLang.id;
  var post = {};
  if (curLang.ismain == true) {
    post = await Post.findOne({
      include: [
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Apkmeta,
          as: 'apk',
          attributes: ['id', 'show_ads_pagedown2', 'off_ads_redirect', 'package_name'],
          include: {
            model: Apkmod,
            as: 'mods',
            include: {
              model: Apklink,
              as: 'links',
            },
          },
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        id: postId,
        poststatus: 'published',
        notenglish: false,
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
      },
      attributes: [
        'id',
        'slug',
        'title',
        'dcateid',
        'offads',
        'offadsall',
        'offadsdownload',
        'adsslot1',
        'adsslot2',
        'adsslot3',
        'adsslot4',
        'notenglish',
      ],
      order: [
        [{ model: Apkmeta, as: 'apk' }, { model: Apkmod, as: 'mods' }, 'numsort', 'DESC'],
        [
          { model: Apkmeta, as: 'apk' },
          { model: Apkmod, as: 'mods' },
          { model: Apklink, as: 'links' },
          'numsort',
          'DESC',
        ],
      ],
    });
  } else {
    post = await Post.findOne({
      include: [
        {
          model: PostLang,
          as: 'PostLang',
          where: {
            langid: curLangId,
          },
          required: false,
        },
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Apkmeta,
          as: 'apk',
          attributes: ['id', 'show_ads_pagedown2', 'off_ads_redirect'],
          include: {
            model: Apkmod,
            as: 'mods',
            include: {
              model: Apklink,
              as: 'links',
            },
          },
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        id: postId,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$PostLang.langid$': curLangId,
          },
        },
      },
      attributes: [
        'id',
        'slug',
        'title',
        'dcateid',
        'offads',
        'offadsall',
        'offadsdownload',
        'adsslot1',
        'adsslot2',
        'adsslot3',
        'adsslot4',
        'notenglish',
      ],
      order: [
        [{ model: Apkmeta, as: 'apk' }, { model: Apkmod, as: 'mods' }, 'numsort', 'DESC'],
        [
          { model: Apkmeta, as: 'apk' },
          { model: Apkmod, as: 'mods' },
          { model: Apklink, as: 'links' },
          'numsort',
          'DESC',
        ],
      ],
      subQuery: false,
    });
  }
  return post;
};

// Lấy post by lang and slug short attributes
exports.getPostByLangAndSlugAttr = async (slug, curLang) => {
  var curLangId = curLang.id;
  var post = {};
  if (curLang.ismain == true) {
    post = await Post.findOne({
      where: {
        slug: slug,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
      },
      attributes: ['id', 'title', 'description', 'seotitle', 'seodescription'],
    });
  } else {
    post = await Post.findOne({
      include: [
        {
          model: PostLang,
          as: 'PostLang',
          where: {
            langid: curLangId,
          },
          required: false,
        },
      ],
      where: {
        slug: slug,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$PostLang.langid$': curLangId,
          },
        },
      },
      attributes: ['id', 'title', 'description', 'seotitle', 'seodescription'],
      subQuery: false,
      //logging: console.log
    });
  }
  return post;
};

// Lấy post by lang, slug, posttype
exports.getPostByLangSlugPosttype = async (slug, curLang, postType) => {
  var curLangId = curLang.id;
  var post = null;
  if (curLang.ismain == true) {
    post = await Post.findOne({
      include: [
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Media,
          as: 'icon',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'firstname', 'lastname', 'avatar', 'nickname'],
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        posttype: postType,
        slug: slug,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
        nolink: false,
      },
    });
  } else {
    post = await Post.findOne({
      include: [
        {
          model: PostLang,
          as: 'PostLang',
          where: {
            langid: curLangId,
          },
          required: false,
        },
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Media,
          as: 'icon',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'firstname', 'lastname', 'avatar', 'nickname'],
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        slug: slug,
        posttype: postType,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
        nolink: false,
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$PostLang.langid$': curLangId,
          },
        },
      },
      subQuery: false,
      //logging: console.log
    });
  }
  return post;
};
// Lấy post nolink
exports.getPostByLangSlugPosttype2 = async (slug, curLang, postType) => {
  var curLangId = curLang.id;
  var post = null;
  if (curLang.ismain == true) {
    post = await Post.findOne({
      include: [
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Media,
          as: 'icon',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'firstname', 'lastname', 'avatar', 'nickname'],
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        posttype: postType,
        slug: slug,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
      },
    });
  } else {
    post = await Post.findOne({
      include: [
        {
          model: PostLang,
          as: 'PostLang',
          where: {
            langid: curLangId,
          },
          required: false,
        },
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Media,
          as: 'icon',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'firstname', 'lastname', 'avatar', 'nickname'],
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        slug: slug,
        posttype: postType,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$PostLang.langid$': curLangId,
          },
        },
      },
      subQuery: false,
      //logging: console.log
    });
  }
  return post;
};

// Lấy post by lang and id
exports.getApkInDownloadPageSlug = async (postSlug, curLang) => {
  var curLangId = curLang.id;
  var post = {};
  if (curLang.ismain == true) {
    post = await Post.findOne({
      include: [
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        slug: postSlug,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
      },
      attributes: [
        'id',
        'slug',
        'title',
        'dcateid',
        'offads',
        'offadsall',
        'offadsdownload',
        'adsslot1',
        'adsslot2',
        'adsslot3',
        'adsslot4',
      ],
    });
  } else {
    post = await Post.findOne({
      include: [
        {
          model: PostLang,
          as: 'PostLang',
          where: {
            langid: curLangId,
          },
          required: false,
        },
        {
          model: Media,
          as: 'thumb',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        slug: postSlug,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$PostLang.langid$': curLangId,
          },
        },
      },
      attributes: [
        'id',
        'slug',
        'title',
        'dcateid',
        'offads',
        'offadsall',
        'offadsdownload',
        'adsslot1',
        'adsslot2',
        'adsslot3',
        'adsslot4',
      ],
      subQuery: false,
    });
  }
  return post;
};

// Lấy post by lang and id
exports.getApkInDownloadPagePID = async (postID, curLang) => {
  var curLangId = curLang.id;
  var post = {};
  if (curLang.ismain == true) {
    post = await Post.findOne({
      include: [
        {
          model: Media,
          as: 'icon',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Apkmeta,
          as: 'apk',
          attributes: [
            'id',
            'show_ads_pagedown2',
            'off_ads_redirect',
            'package_name',
            'mod_text',
            'version',
          ],
          include: {
            model: Apkmod,
            as: 'mods',
            include: {
              model: Apklink,
              as: 'links',
            },
          },
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        id: postID,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
      },
      attributes: [
        'id',
        'slug',
        'title',
        'dcateid',
        'offads',
        'offadsall',
        'offadsdownload',
        'adsslot1',
        'adsslot2',
        'adsslot3',
        'adsslot4',
      ],
      order: [
        [{ model: Apkmeta, as: 'apk' }, { model: Apkmod, as: 'mods' }, 'numsort', 'DESC'],
        [
          { model: Apkmeta, as: 'apk' },
          { model: Apkmod, as: 'mods' },
          { model: Apklink, as: 'links' },
          'numsort',
          'DESC',
        ],
      ],
    });
  } else {
    post = await Post.findOne({
      include: [
        {
          model: PostLang,
          as: 'PostLang',
          where: {
            langid: curLangId,
          },
          required: false,
        },
        {
          model: Media,
          as: 'icon',
          attributes: ['id', 'url', 'urlicon', 'childsizes'],
        },
        {
          model: Apkmeta,
          as: 'apk',
          attributes: [
            'id',
            'show_ads_pagedown2',
            'off_ads_redirect',
            'package_name',
            'mod_text',
            'version',
          ],
          include: {
            model: Apkmod,
            as: 'mods',
            include: {
              model: Apklink,
              as: 'links',
            },
          },
        },
        {
          model: Ads,
          as: 'Ads',
          attributes: [
            'id',
            'adscode',
            'slot1',
            'slot2',
            'slot3',
            'slot4',
            'slot5',
            'slot6',
            'islazy',
            'offads',
          ],
        },
      ],
      where: {
        id: postID,
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$PostLang.langid$': curLangId,
          },
        },
      },
      attributes: [
        'id',
        'slug',
        'title',
        'dcateid',
        'offads',
        'offadsall',
        'offadsdownload',
        'adsslot1',
        'adsslot2',
        'adsslot3',
        'adsslot4',
      ],
      order: [
        [{ model: Apkmeta, as: 'apk' }, { model: Apkmod, as: 'mods' }, 'numsort', 'DESC'],
        [
          { model: Apkmeta, as: 'apk' },
          { model: Apkmod, as: 'mods' },
          { model: Apklink, as: 'links' },
          'numsort',
          'DESC',
        ],
      ],
      subQuery: false,
    });
  }
  return post;
};

exports.Autoicon = async (req, res) => {
  try {
    var limit = parseInt(req.query.num) || 100;
    var posts = await Post.findAll({
      where: {
        posttype: 'post-apk',
        imgicon: null,
      },
      limit: limit,
    });
    var rs = {
      count: posts.length,
      ok: 0,
    };
    await posts.forEach(async (p) => {
      var apk = await Apkmeta.findOne({
        where: {
          postid: p.id,
        },
        attributes: ['playstore_url'],
      });
      var playstore_url = apk && apk.playstore_url ? apk.playstore_url : '';
      playstore_url = playstore_url ? playstore_url : '';
      var pakageName = functions.get_param_url(playstore_url, 'id');
      if (pakageName != null) {
        var url = `${apkleechCf.getinfo}${pakageName}`;
        const options = {
          method: 'GET',
          uri: url,
          json: true,
        };
        await request(options)
          .then(async function (rs) {
            var iconUrl = rs && rs.icon && rs.icon.length > 0 ? rs.icon : '';
            if (iconUrl.length > 0) {
              // Load icon
              var imgOptions = {
                method: 'POST',
                headers: {
                  'x-access-token': req.session.token ? req.session.token : '',
                },
                uri: `${domain}/${dashboard}/media/download`,
                body: {
                  imgurl: rs.icon,
                  title: p.title,
                  type: 'icon',
                },
                json: true,
              };
              await request(imgOptions).then(async function (icon) {
                if (icon.code == 1) {
                  await Post.update(
                    {
                      imgicon: icon.data.id,
                    },
                    {
                      where: {
                        id: p.id,
                      },
                    }
                  );
                  rs.ok = rs.ok + 1;
                }
              });
            }
          })
          .catch((err) => { });
      }
    });
    return res.json(rs);
  } catch (err) {
    return res.json(err.message);
  }
};
