const functions = require('../libs/functions');
var ejs = require('ejs');
var xssFilters = require('xss-filters');
const cheerio = require('cheerio');
const schema = require('./seo.schema.controller');
const seometa = require('./seo.meta.controller');
const commentController = require('./comment.controller');
const interActiveController = require('./interactive.controller');
const menuController = require('./menu.controller');
const errorController = require('./error.controller');
const paginationController = require('./pagination.controller');
const breadcumbController = require('./breadcumb.controller');
const postController = require('./post.controller');
const cateController = require('./category.controller');
const tocController = require('./toc.controller');
const db = require('../models');
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Post = db.post;
const Apkmeta = db.apkmeta;
const Apkmod = db.apkmod;
const Apklink = db.apklink;
const Apkfaq = db.apkfaq;
const Category = db.category;
const Language = db.language;
const Media = db.media;
const Ringtone = db.ringtone;
const Type = db.type;
const LogApkFile = db.logapkfile;
const maxNumPostsHome = 6;
const maxNumPostsCate = 12;
const config = require('config');
const appConf = config.get('app');
const gameSlug = appConf.gameSlug || 'games';
const appSlug = appConf.appSlug || 'apps';
const Roles = db.role;
// http://domain
exports.homePage = async (req, res) => {
  try {
    await execHomePage(req, res);
  } catch (err) {
    // loi phat sinh khi select data
    return errorController.render500(req, res);
  }
};

// http://domain/es
// http://domain/category-slug
// http://domain/post-slug
exports.onlySlugPage = async (req, res) => {
  try {
    var curLang = req.curLang;
    var slug = req.params.slug;
    if (slug === undefined || slug === '' || slug === null) {
      // gia tri slug truyen vao url sai
      await exec404Page(req, res);
    } else {
      slug = slug.toLowerCase();
      const slugLang = await Language.findOne({
        where: {
          id: slug,
          isblock: false,
          ismain: false,
        },
        attributes: ['id', 'name', 'codelang', 'ismain'],
        raw: true,
      });
      // slug truyền vào url là Language ID
      if (slugLang !== null) {
        req.curLang = slugLang;
        await execHomePage(req, res);
      } else {
        //var page = await postController.getPostByLangSlugPosttype(slug, curLang, "post-page");
        //var page = await postController.getPostByLangAndSlug(slug, curLang);
        var page = await postController.getPostByLangAndSlugExtension(slug, curLang, '');
        if (page != null) {
          // slug truyền vào url là Post Page Slug
          req.pageContent = page;
          await execPostPage(req, res);
        } else {
          const category = await cateController.getCategoryByLangAndSlug(slug, curLang);
          if (category != null) {
            // slug truyền vào url là Category Slug
            req.pageContent = category;
            await execCategoryPage(req, res);
          } else {
            // slug truyền vào url không phải Language cũng nư Category
            await exec404Page(req, res);
          }
        }
      }
    }
  } catch (err) {
    // loi phat sinh khi select data
    return errorController.render500(req, res);
  }
};

// http://domain/es/games
// http://domain/es/about-us
// http://domain/games/adventure
exports.hasSlugPage = async (req, res) => {
  try {
    var curLang = req.curLang;
    var langid = req.params.langid;
    if (typeof langid !== 'undefined') {
      const tmpLang = await Language.findOne({
        where: {
          id: langid,
          isblock: false,
          ismain: false,
        },
        attributes: ['id', 'name', 'codelang', 'ismain'],
        raw: true,
      });
      // Url có ngôn ngữ hợp lệ với langid truyền vào
      // http://domain/es/games
      if (tmpLang != null) {
        curLang = tmpLang;
        req.curLang = tmpLang;
      }
    }
    var slug = req.params.slug;
    slug = slug == undefined || slug == null ? '' : slug;
    const category = await cateController.getCategoryByLangAndSlug(slug, curLang);
    if (category != null) {
      var rootCateSlug = await Category.getRootSlug(category.id);
      var curUrl = req.url;
      curUrl = !curLang.ismain ? curUrl.replace(`/${curLang.id}/`, '') : curUrl.replace(/^\//g, '');
      curUrl = curUrl.match(/\/page\/\d*/g) ? curUrl.replace(/\/page\/\d*/g, '') : curUrl;
      curUrl = curUrl.replace(/\/$/g, '');
      curUrl = curUrl.replace(/\?\w+\=\w+$/g, '');
      var checkUrl = curUrl.replace(/\/$/g, '');
      if (checkUrl === rootCateSlug) {
        req.pageContent = category;
        await execCategoryPage(req, res);
      } else {
        await exec404Page(req, res);
      }
    } else {
      const page = await postController.getPostByLangAndSlug(slug, curLang);
      if (page != null) {
        req.pageContent = page;
        await execPostPage(req, res);
      } else {
        await exec404Page(req, res);
      }
    }
  } catch (err) {
    // loi phat sinh khi select data
    return errorController.render500(req, res);
  }
};

// http://domain/es/games/adventure
// http://domain/es/games/adventure/page/2
// http://domain/games/adventure/random
// http://domain/games/adventure/rando/page/2
// http://domain/es/games/adventure/random
// http://domain/es/games/adventure/random/page/2
// Category multiple level link
exports.hasLangSlugCategory = async (req, res) => {
  try {
    var curLang = req.curLang;
    var langid = req.params.langid;
    var curUrl = req.url;
    if (typeof langid !== 'undefined') {
      const tmpLang = await Language.findOne({
        where: {
          id: langid,
          isblock: false,
          ismain: false,
        },
        attributes: ['id', 'name', 'codelang', 'ismain'],
        raw: true,
      });
      if (tmpLang != null) {
        curLang = tmpLang;
        req.curLang = tmpLang;
        curUrl = curUrl.replace(`/${curLang.id}`, '');
      }
    }
    var urlNonePage = curUrl.replace(/\/page\/\d*/g, '');
    urlNonePage = urlNonePage.replace(/\?\w+\=\w+$/g, '');
    urlNonePage = urlNonePage.replace(/^\//g, '');
    var arrMultipleLevelSlug = urlNonePage.split('/');
    var lastSlug =
      arrMultipleLevelSlug.length > 0 ? arrMultipleLevelSlug[arrMultipleLevelSlug.length - 1] : '';
    const category = await cateController.getCategoryByLangAndSlug(lastSlug, curLang);
    if (category != null) {
      var rootCateSlug = await Category.getRootSlug(category.id);
      if (urlNonePage === rootCateSlug) {
        req.pageContent = category;
        await execCategoryPage(req, res);
      } else {
        await exec404Page(req, res);
      }
    } else {
      await exec404Page(req, res);
    }
  } catch (err) {
    // loi phat sinh khi select data
    return errorController.render500(req, res);
  }
};

// http://domain/ringtones
// http://domain/es/ringtones
exports.ringtonesPage = async (req, res) => {
  try {
    var langid = req.params.langid,
      ringtone = {},
      curLang = req.curLang;
    // Url có langid
    if (typeof langid !== 'undefined') {
      langid = langid == null ? '' : langid;
      const tmpLang = await Language.findOne({
        where: {
          id: langid,
          isblock: false,
          ismain: false,
        },
        attributes: ['id', 'name', 'codelang', 'ismain'],
        raw: true,
      });
      // Url có ngôn ngữ hợp lệ với langid truyền vào
      if (tmpLang != null) {
        curLang = tmpLang;
        req.curLang = tmpLang;
      } else {
        // Url có langid không tồn tại hoặc bị khóa
        await exec404Page(req, res);
        return;
      }
    }
    var slug = req.params.slug;
    if (typeof slug === 'undefined') {
      // http://domain/ringtones
      // http://domain/es/ringtones
      //ringtone = await getPostByLangSlugPosttype("ringtones", curLang, "post-page");
      ringtone = await postController.getPostByLangSlugPosttype2('ringtones', curLang, 'post-page');
      req.cateid = '%';
    } else {
      // http://domain/ringtones/wwe
      // http://domain/es/ringtones/wwe
      slug = slug !== null ? slug : '';
      ringtone = await postController.getPostByLangSlugPosttype(slug, curLang, 'post-ringstone');
      req.cateid = ringtone !== null ? ringtone.id : '';
    }
    if (ringtone == null) {
      await exec404Page(req, res);
    } else {
      ringtone = !curLang.ismain ? functions.postMaping(ringtone) : ringtone;
      req.pageContent = ringtone;
      await execRingtonesPage(req, res);
    }
  } catch (err) {
    return errorController.render500(req, res);
  }
};

// http://domain/developer
// http://domain/es/developer
exports.developerPage = async (req, res) => {
  try {
    var langid = req.params.langid,
      developer = {},
      curLang = req.curLang;
    // Url có langid
    if (typeof langid !== 'undefined') {
      langid = langid == null ? '' : langid;
      const tmpLang = await Language.findOne({
        where: {
          id: langid,
          isblock: false,
          ismain: false,
        },
        attributes: ['id', 'name', 'codelang', 'ismain'],
        raw: true,
      });
      // Url có ngôn ngữ hợp lệ với langid truyền vào
      if (tmpLang != null) {
        curLang = tmpLang;
        req.curLang = tmpLang;
      } else {
        // Url có langid không tồn tại hoặc bị khóa
        await exec404Page(req, res);
        return;
      }
    }
    var slug = req.params.slug;
    slug = slug == undefined || slug == null ? '' : slug;
    developer = await cateController.getCategoryByLangSlugCatetype(slug, curLang, 'developer-apk');
    if (developer != null) {
      req.pageContent = developer;
      await execCategoryPage(req, res);
    } else {
      await exec404Page(req, res);
    }
  } catch (err) {
    return errorController.render500(req, res);
  }
};

// http://domain/tag
// http://domain/es/tag
exports.tagPage = async (req, res) => {
  try {
    var langid = req.params.langid,
      developer = {},
      curLang = req.curLang;
    // Url có langid
    if (typeof langid !== 'undefined') {
      langid = langid == null ? '' : langid;
      const tmpLang = await Language.findOne({
        where: {
          id: langid,
          isblock: false,
          ismain: false,
        },
        attributes: ['id', 'name', 'codelang', 'ismain'],
        raw: true,
      });
      // Url có ngôn ngữ hợp lệ với langid truyền vào
      if (tmpLang != null) {
        curLang = tmpLang;
        req.curLang = tmpLang;
      } else {
        // Url có langid không tồn tại hoặc bị khóa
        await exec404Page(req, res);
        return;
      }
    }
    var slug = req.params.slug;
    slug = slug == undefined || slug == null ? '' : slug;
    developer = await cateController.getCategoryByLangSlugCatetype(slug, curLang, 'tags');
    if (developer != null) {
      req.pageContent = developer;
      await execCategoryPage(req, res);
    } else {
      await exec404Page(req, res);
    }
  } catch (err) {
    return errorController.render500(req, res);
  }
};

// http://domain/post.html
// http://domain/es/post.html
exports.singlePage = async (req, res) => {
  try {
    var curLang = req.curLang;
    var langid = req.params.langid;
    if (typeof langid !== 'undefined') {
      const tmpLang = await Language.findOne({
        where: {
          id: langid,
          isblock: false,
          ismain: false,
        },
        attributes: ['id', 'name', 'codelang', 'ismain'],
      });
      // Url có ngôn ngữ hợp lệ với langid truyền vào
      if (tmpLang != null) {
        curLang = tmpLang;
        req.curLang = tmpLang;
      } else {
        // Url có langid không tồn tại hoặc bị khóa
        await exec404Page(req, res);
        return;
      }
    }
    var slug = req.params.slug;
    slug = slug == undefined || slug == null ? '' : slug;
    /* const post = await getPostByLangAndSlug(slug, curLang); */
    const post = await postController.getPostByLangAndSlugExtension(slug, curLang, '.html'); //123321
    if (post == null) {
      await exec404Page(req, res);
    } else {
      req.pageContent = post;
      await execPostPage(req, res);
    }
  } catch (err) {
    // loi phat sinh khi select data
    return errorController.render500(req, res);
  }
};

exports.ajaxPostHome = async (req, res) => {
  try {
    var curLang = req.curLang,
      postType = req.body.postType || '',
      action = req.body.action,
      offset = req.body.offset || 0,
      page = parseInt(offset / maxNumPostsHome) + 1,
      posts = { count: 0, rows: [] },
      rsText = '';
    if (postType == 'apk') {
      posts = await postController.getApkByLangHasSort(action, curLang, page, maxNumPostsHome);
      if (posts.rows.length > 0) {
        rsText = await ejs.renderFile(
          'views/web/templates/loop-apk.ejs',
          { posts: posts.rows, page: { curLang: curLang } },
          { async: true }
        );
      }
    }
    if (postType == 'blog') {
      posts = await postController.getPostByLangHasSort(
        action,
        'post-blog',
        curLang,
        page,
        maxNumPostsHome
      );
      if (posts.rows.length > 0) {
        rsText = await ejs.renderFile(
          'views/web/templates/loop-post.ejs',
          { posts: posts.rows, page: { curLang: curLang } },
          { async: true }
        );
      }
    }
    rsText = rsText.replace(/\n|\t|\s{2,}/g, '');
    res.json({
      code: 1,
      message: 'Successfully',
      data: { html: rsText, end: posts.curPage >= posts.maxPage },
    });
  } catch (err) {
    return errorController.render500(req, res);
  }
};

// Done
// Xử lý tập hợp URL của Home
async function execHomePage(req, res) {
  try {
    var userRole = req.session.role;
    var curLang = req.curLang,
      query = req.query.s,
      preview = req.query.preview;
    if (query !== undefined) {
      await execSearchPage(req, res);
      return;
    }
    if (preview !== undefined) {
      await execPreviewPage(req, res);
      return;
    }
    var pageContent = await postController.getPostByLangSlugPosttype2('home', curLang, 'post-page');
    if (pageContent == null) {
      return errorController.render500(req, res);
    }
    pageContent = !curLang.ismain ? functions.postMaping(pageContent) : pageContent;
    var menuHeader = await menuController.getMenuFontEnd(
      curLang,
      'menu-header',
      'home',
      pageContent.id,
      ''
    );
    var menuFooter = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer',
      'home',
      pageContent.id,
      ''
    );
    var menuFooterRight = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer-right',
      'home',
      pageContent.id,
      ''
    );
    // Show posts to home
    var cateGameIds = await Category.findAllChildIds(appConf.gameId || 0);
    cateGameIds.push(appConf.gameId || 0);
    var homeBestGames = await postController.getApkByCateIdsLangHasSort(
      'updated',
      cateGameIds,
      curLang,
      1,
      12
    );
    var cateAppIds = await Category.findAllChildIds(appConf.appId || 0);
    cateAppIds.push(appConf.appId || 0);
    var homeBestApps = await postController.getApkByCateIdsLangHasSort(
      'updated',
      cateAppIds,
      curLang,
      1,
      12
    );
    var homeApkChoices = await postController.getApkChoices('updated', curLang, 1, 8);
    var homeLastestBlogs3 = await postController.getPostByLangHasSort(
      'updated',
      'post-blog',
      curLang,
      1,
      6
    );
    // var homeLastestBlogs3 = await postController.getAllPostByCateIdsLangHasSort(
    //   'updated',
    //   [289, 408],
    //   curLang,
    //   1,
    //   6
    // );
    var homeLastestBlogs = homeLastestBlogs3.rows || [];

    // SEO Meta tags
    var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
    var seoTitle = pageContent.seotitle == '' ? pageContent.title : pageContent.seotitle;
    var seoDescription =
      pageContent.seodescription == '' ? pageContent.description : pageContent.seodescription;
    var homeSeoObject = {
      pagetype: 'website',
      seotitle: seoTitle,
      seodescription: seoDescription,
      index: pageContent.allowindex || false,
      follow: pageContent.allowfollow || false,
      publishat: pageContent.publishedat,
      modifyat: pageContent.modifiedat,
    };
    var metaHome = await seometa.homeMeta(curLang, req.url, homeSeoObject, arrLangsExists);
    // SEO schema structure
    var arrSchema = [];
    arrSchema.push(await schema.Organization(curLang, req.languages, pageContent));
    //arrSchema.push(await schema.WebSite(curLang, seoDescription));
    arrSchema.push(await schema.WebSite(curLang));
    arrSchema.push(await schema.ImageObject(curLang, req.url, pageContent.thumb));
    //arrSchema.push(await schema.WebPage("home", curLang, req.url, homeSeoObject));
    // SEO breadcumbs
    /* var breadcrumbs = await breadcumbController.createBreadcumb(null, curLang, null, req.url);
        if (breadcrumbs && breadcrumbs.schema) {
            arrSchema.push(breadcrumbs.schema);
        } */

    var role = await Roles.findOne({
      where: {
        rolename: "Administrator"
      },
    });
    var catesSidebar = [];
    var appsSidebar = [];
    var rootCateSlug = 'games';
    var rootAppSlug = 'apps';
    catesSidebar = await cateController.getCategoryByLangParentSlug(rootCateSlug, curLang);
    appsSidebar = await cateController.getCategoryByLangParentSlug(rootAppSlug, curLang);
    var page = {
      curLang: curLang,
      seoMeta: metaHome.join(''),
      seoSchema: arrSchema.join(','),
      menuHeader: menuHeader,
      menuFooter: menuFooter,
      menuFooterRight: menuFooterRight,
      pageContent: pageContent,
      homeBestGames: homeBestGames,
      homeBestApps: homeBestApps,
      homeApkChoices: homeApkChoices,
      homeLastestBlogs: homeLastestBlogs,
      catesSidebar: catesSidebar,
      appsSidebar: appsSidebar,
      userRole: userRole,
      role: role
    };
    res.render('web/index', { page: page });
  } catch (err) {
    console.log(err);
    return errorController.render500(req, res);
  }
}

// Xử lý tập hợp URL của Search
async function execSearchPage(req, res) {
  try {
    var curLang = req.curLang,
      query = req.query.s || '';
    //query = functions.decode_specials_char(query);
    query = xssFilters.inHTMLData(query);
    var pageContent = await postController.getPostByLangSlugPosttype2(
      'search',
      curLang,
      'post-page'
    );
    if (pageContent == null) {
      res.status(500).send('Search page is incorrect config!!!');
      return;
    }
    pageContent = !curLang.ismain ? functions.postMaping(pageContent) : pageContent;
    pageContent.title = `${pageContent.title} ${query}`;
    var menuHeader = await menuController.getMenuFontEnd(
      curLang,
      'menu-header',
      'home',
      pageContent.id,
      ''
    );
    var menuFooter = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer',
      'home',
      pageContent.id,
      ''
    );
    var menuFooterRight = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer-right',
      'home',
      pageContent.id,
      ''
    );
    var postSearch = await postController.getPostSearch(query, curLang, 1, maxNumPostsCate);
    // SEO Meta tags
    var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
    var seoTitle = `${pageContent.seotitle} ${query}`;
    var seoDescription =
      pageContent.seodescription == '' ? pageContent.description : pageContent.seodescription;
    var homeSeoObject = {
      pagetype: 'object',
      seotitle: seoTitle,
      seodescription: seoDescription,
      index: pageContent.allowindex || false,
      follow: pageContent.allowfollow || false,
      publishat: pageContent.publishedat,
      modifyat: pageContent.updatedAt,
    };
    var metaHome = await seometa.homeMeta(curLang, req.url, homeSeoObject, arrLangsExists);
    // SEO schema structure
    var arrSchema = [];
    var catesSidebar = [];
    var appsSidebar = [];
    var rootCateSlug = 'games';
    var rootAppSlug = 'apps';
    catesSidebar = await cateController.getCategoryByLangParentSlug(rootCateSlug, curLang);
    appsSidebar = await cateController.getCategoryByLangParentSlug(rootAppSlug, curLang);
    var page = {
      curLang: curLang,
      seoMeta: metaHome.join(''),
      seoSchema: arrSchema.join(','),
      menuHeader: menuHeader,
      menuFooter: menuFooter,
      menuFooterRight: menuFooterRight,
      pageContent: pageContent,
      postSearch: postSearch,
      pagination: '',
      catesSidebar: catesSidebar,
      appsSidebar: appsSidebar
    };
    res.render('web/search', { page: page });
  } catch (err) {
    return errorController.render500(req, res);
  }
}

// Ajax suggest search
exports.ajaxSuggestSearch = async (req, res) => {
  try {
    var searchText = req.body.s || '';
    searchText = xssFilters.inHTMLData(searchText);
    var postSearch = await Post.findAll({
      where: {
        title: {
          [Op.like]: `%${searchText}%`,
        },
        posttype: ['post-apk', 'post-blog'],
        poststatus: 'published',
        publishedat: {
          [Op.lte]: sequelize.fn('NOW'),
        },
      },
      attributes: ['title'],
      order: [['viewcount', 'DESC']],
      limit: 5,
      raw: true,
    });
    postSearch = postSearch !== null ? postSearch : [];
    res.json({ code: 1, message: 'Successfully', data: postSearch, keyword: searchText });
  } catch (err) {
    res.json({ code: 1, message: '', data: [] });
  }
};

// Done
// Xu ly trang download APK
exports.execDownloadApkPage = async (req, res) => {
  try {
    var curLang = req.curLang,
      postSlug = req.params.slug,
      curLangId = req.params.langid,
      renderText = 'web/single-apk-download',
      postIdMatch = postSlug.match(/\d+$/g),
      postId = postIdMatch && postIdMatch[0] ? postIdMatch[0] : '',
      homeUrl = curLang.ismain ? domain : `${domain}/${curLang.id}`;
    // Bat buoc phai truyen vao post ID
    if (postSlug === undefined) {
      await exec404Page(req, res);
      return;
    }
    if (curLangId !== undefined) {
      curLang = await Language.findOne({
        where: { id: curLangId },
        attributes: ['id', 'codelang', 'name', 'ismain'],
      });
      // Ma ngon ngu truyen vao khong ton tai
      if (curLang == null) {
        await exec404Page(req, res);
        return;
      }
    }
    // Post ID truyen vao khong ton tai hoac chua published hoặc truyền sai tên app
    //var apk = await postController.getApkInDownloadPageSlug(postSlug, curLang);
    var apk = await postController.getApkInDownloadPagePID(postId, curLang);
    apk = apk ? apk : {};
    var apkID = apk.id ? apk.id : '';
    var slugFormTitle = apk.title ? `${functions.convert_slug(apk.title)}-${apkID}` : '';
    if (slugFormTitle !== postSlug) {
      await exec404Page(req, res);
      return;
    }
    apk = !curLang.ismain ? functions.postMaping(apk) : apk;
    var apkMeta = await Apkmeta.findOne({
      where: {
        postid: apkID,
      },
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
        where: {
          showinsingle: true,
        },
        include: {
          model: Apklink,
          as: 'links',
        },
        required: false,
      },
      order: [
        [{ model: Apkmod, as: 'mods' }, 'numsort', 'DESC'],
        [{ model: Apkmod, as: 'mods' }, { model: Apklink, as: 'links' }, 'numsort', 'DESC'],
      ],
    });
    apk.apk = apkMeta ? apkMeta : {};
    var pageContent = await postController.getPostByLangSlugPosttype2(
      'apk-download',
      curLang,
      'post-page'
    );
    // Chua khai bao page DOWNLOAD trong muc page template
    if (pageContent == null) {
      return errorController.render500(req, res);
    }
    pageContent = !curLang.ismain ? functions.postMaping(pageContent) : pageContent;
    //var menuHeader = await menuController.getMenuFontEnd(curLang, 'menu-header', "post", pageContent.id, req.url);
    var menuHeader = await menuController.getMenuFontEnd(
      curLang,
      'menu-header',
      'post',
      apk.id,
      req.url
    );
    var menuFooter = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer',
      'post',
      pageContent.id,
      req.url
    );
    var menuFooterRight = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer-right',
      'post',
      pageContent.id,
      req.url
    );
    // SEO Meta tags
    var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
    var seoTitle = pageContent.seotitle == '' ? pageContent.title : pageContent.seotitle;
    seoTitle += ` ${apk.title} - ${sitename}`;
    var seoDescription =
      pageContent.seodescription == '' ? pageContent.description : pageContent.seodescription;
    var homeSeoObject = {
      pagetype: 'article',
      seotitle: seoTitle,
      seodescription: seoDescription,
      index: pageContent.allowindex || false,
      follow: pageContent.allowfollow || false,
      publishat: pageContent.publishedat,
      modifyat: pageContent.updatedAt,
    };
    // SEO meta
    //var canonical = (curLang.ismain) ? `${domain}/${apk.slug}-${}/` : `${domain}/${curLang.id}/${apk.slug}-${}/`;
    var canonical = req.protocol + '://' + req.get('host') + req.originalUrl;
    canonical = `${homeUrl}/${apk.slug}/`;
    var metaHome = await seometa.downloadMeta(
      curLang,
      req.url,
      canonical,
      homeSeoObject,
      arrLangsExists
    );
    // SEO breadcumbs
    var defcateid = apk.dcateid ? apk.dcateid : null;
    if (defcateid == null) {
      defcateid = await Category.getCateMinHirarchyLevel(apk.id);
    }
    var breadcrumbs = await breadcumbController.createBreadcumb(
      defcateid,
      curLang,
      apk.title,
      req.url,
      res.__('textHome')
    );
    var page = {
      curLang: curLang,
      seoMeta: metaHome.join(''),
      menuHeader: menuHeader,
      menuFooter: menuFooter,
      menuFooterRight: menuFooterRight,
      pageContent: pageContent,
      apk: apk,
      apkYouLike: [],
      breadcrumbs: breadcrumbs,
      linkdownload: {},
    };
    res.render(renderText, { page: page });
  } catch (err) {
    console.log(err);
    return errorController.render500(req, res);
  }
};

// Done
// Xu ly trang download2 APK Mod and Original
exports.execDownloadApkPage2 = async (req, res) => {
  try {
    var curLang = req.curLang,
      slug = req.params.slug,
      match = slug.match(/\d+\-\d+$/g),
      arr = match ? match[0].split('-') : [];
    (pid = arr[0] ? arr[0] : ''),
      (lid = arr[1] ? arr[1] : ''),
      (oid = lid),
      (postSlug = slug.substring(0, slug.length - (pid.length + lid.length + 2))),
      (curLangId = req.params.langid),
      (curUrl = req.url),
      (renderText = 'web/single-apk-download2'),
      (homeUrl = curLang.ismain ? domain : `${domain}/${curLang.id}`);
    if (curLang.id !== curLangId && curLangId !== undefined) {
      curLang = await Language.findOne({
        where: { id: curLangId },
        attributes: ['id', 'codelang', 'name', 'ismain'],
      });
      // Ma ngon ngu truyen vao khong ton tai
      if (curLang == null) {
        await exec404Page(req, res);
        return;
      }
    }
    var apk = await postController.getApkInDownloadPagePID(pid, curLang);
    apk = apk ? apk : {};
    // Post ID truyen vao khong ton tai hoac chua published
    var slugFormTitle = apk.title ? functions.convert_slug(apk.title) : '';
    if (slugFormTitle !== postSlug) {
      await exec404Page(req, res);
      return;
    }
    apk = !curLang.ismain ? functions.postMaping(apk) : apk;
    var pageContent = await postController.getPostByLangSlugPosttype2(
      'apk-download-2',
      curLang,
      'post-page'
    );
    // Chua khai bao page DOWNLOAD trong muc page template
    if (pageContent == null) {
      return errorController.render500(req, res);
    }
    pageContent = !curLang.ismain ? functions.postMaping(pageContent) : pageContent;
    var linkdownload = {};
    // Url download la link tai cuoi cua MOD LINK
    linkdownload = await Apklink.findOne({
      where: {
        id: lid,
        postid: pid,
      },
      include: {
        model: Apkmod,
        as: 'mod',
        attributes: ['title'],
      },
    });
    if (linkdownload == null) {
      if (curUrl.match(/download\/original\//g)) {
        // Url download la link tai cuoi cua ORIGINAL LINK
        var originalLink = await LogApkFile.findOne({
          where: {
            postid: apk.id,
          },
          attributes: ['apklink', 'apksize', 'apkversion', 'obblink', 'obbsize', 'isnolink'],
        });
        if (originalLink == null || originalLink.isnolink) {
          await exec404Page(req, res);
          return;
        }
        let appName = apk.title,
          appVersion = originalLink.apkversion,
          appLink = oid == 2 ? originalLink.obblink : originalLink.apklink,
          appSize = oid == 2 ? originalLink.obbsize : originalLink.apksize;
        appVersion = appVersion.replace(/\s/g, '-').toLowerCase();
        //appName = `${functions.convert_slug(appName)}-${appVersion}`;
        //appName = (oid==2) ? `obb-${appName}.zip` : `${appName}.apk`;
        appName = `${appName} ${appVersion} [${appSize}]`;
        appName = oid == 2 ? `[OBB] - ${appName}` : appName;
        if (oid == 2) {
          let arrAppLink = appLink.split('?'),
            replaceLink = 'https://file2.techbigs.download/direct/download.php';
          appLink = arrAppLink.length > 1 ? replaceLink.concat('?', arrAppLink[1], '&name=', appName) : appLink;
        }
        // Không chứa link tải thì cho thành 404
        if (appLink == '') {
          await exec404Page(req, res);
          return;
        }
        linkdownload = {
          title: appName,
          link: appLink,
          size: appSize,
          version: appVersion,
          isObb: oid == 2,
          original: true,
        };
      } else {
        await exec404Page(req, res);
        return;
      }
    }
    //var menuHeader = await menuController.getMenuFontEnd(curLang, 'menu-header', "post", pageContent.id, req.url);
    var menuHeader = await menuController.getMenuFontEnd(
      curLang,
      'menu-header',
      'post',
      apk.id,
      req.url
    );
    var menuFooter = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer',
      'post',
      pageContent.id,
      req.url
    );
    var menuFooterRight = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer-right',
      'post',
      pageContent.id,
      req.url
    );
    // SEO Meta tags
    var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
    var seoTitle = pageContent.seotitle == '' ? pageContent.title : pageContent.seotitle;
    seoTitle += ` ${apk.title} - ${sitename}`;
    var seoDescription =
      pageContent.seodescription == '' ? pageContent.description : pageContent.seodescription;
    var homeSeoObject = {
      pagetype: 'article',
      seotitle: seoTitle,
      seodescription: seoDescription,
      index: pageContent.allowindex || false,
      follow: pageContent.allowfollow || false,
      publishat: pageContent.publishedat,
      modifyat: pageContent.updatedAt,
    };
    // SEO meta
    //var canonical = (curLang.ismain) ? `${domain}/${apk.slug}/` : `${domain}/${curLang.id}/${apk.slug}/`;
    var canonical = req.protocol + '://' + req.get('host') + req.originalUrl;
    canonical = `${homeUrl}/${apk.slug}/`;
    var metaHome = await seometa.downloadMeta(
      curLang,
      req.url,
      canonical,
      homeSeoObject,
      arrLangsExists
    );
    // SEO breadcumbs
    var defcateid = apk.dcateid ? apk.dcateid : null;
    if (defcateid == null) {
      defcateid = await Category.getCateMinHirarchyLevel(apk.id);
    }
    var breadcrumbs = await breadcumbController.createBreadcumb(
      defcateid,
      curLang,
      apk.title,
      req.url,
      res.__('textHome')
    );
    var page = {
      curLang: curLang,
      seoMeta: metaHome.join(''),
      menuHeader: menuHeader,
      menuFooter: menuFooter,
      menuFooterRight: menuFooterRight,
      pageContent: pageContent,
      apk: apk,
      apkYouLike: [],
      breadcrumbs: breadcrumbs,
      linkdownload: linkdownload,
    };
    res.render(renderText, { page: page });
  } catch (err) {
    console.log(err);
    return errorController.render500(req, res);
  }
};

// Xử lý tập hợp URL page login, register, account/*
exports.execPostPage = async (req, res) => {
  try {
    var curUrl = req.originalUrl;
    var slug = curUrl.match(/\/\w*-*\w*$/g);
    slug = slug.length > 0 ? slug[0].replace(/^\//g, '') : '';
    var curLang = req.curLang;
    var pageContent = await postController.getPostByLangSlugPosttype2(slug, curLang, 'post-page');
    if (pageContent == null) {
      return errorController.render404(req, res);
    }
    pageContent = !curLang.ismain ? functions.postMaping(pageContent) : pageContent;
    var curUrlNoneLang = curUrl.replace(`/${curLang.id}`, '');
    var menuHeader = await menuController.getMenuFontEnd(
      curLang,
      'menu-header',
      'post',
      pageContent.id,
      curUrlNoneLang,
      pageContent.notenglish
    );
    var menuFooter = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer',
      'post',
      pageContent.id,
      curUrlNoneLang
    );
    var menuFooterRight = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer-right',
      'post',
      pageContent.id,
      curUrlNoneLang
    );
    // SEO Meta tags
    var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
    var seoTitle = pageContent.seotitle == '' ? pageContent.title : pageContent.seotitle;
    var seoDescription =
      pageContent.seodescription == '' ? pageContent.description : pageContent.seodescription;
    var homePage = await postController.getPostByLangAndSlugAttr('home', curLang);
    homePage = !curLang.ismain ? functions.postMaping(homePage) : homePage;
    var pageSeoObject = {
      pagetype: 'website',
      seotitle: seoTitle,
      seodescription: seoDescription,
      index: pageContent.allowindex || false,
      follow: pageContent.allowfollow || false,
      author: pageContent.author || '0',
      name: pageContent.title,
      publishat: functions.formart_datetime(pageContent.publishedat, 'seo'),
      modifyat: functions.formart_datetime(pageContent.modifiedat, 'seo'),
    };
    var metaPost = [];
    metaPost = await seometa.baseMeta(curLang, curUrl, pageSeoObject, arrLangsExists);
    // SEO schema structure
    var arrSchema = [];
    arrSchema.push(await schema.Organization(curLang, req.languages, homePage));
    //arrSchema.push(await schema.WebSite(curLang, seoDescriptionHome));
    arrSchema.push(await schema.WebSite(curLang));
    var thumb = pageContent.thumb || null;
    if (thumb != null) {
      arrSchema.push(await schema.ImageObject(curLang, curUrl, thumb));
    }
    arrSchema.push(await schema.WebPage('page', curLang, curUrl, pageSeoObject));

    var breadcrumbs = await breadcumbController.createBreadcumb(
      null,
      curLang,
      pageContent.title,
      curUrl,
      res.__('textHome')
    );
    if (breadcrumbs && breadcrumbs.schema) {
      arrSchema.push(breadcrumbs.schema);
    }
    var page = {
      curLang: curLang,
      seoMeta: metaPost.join(''),
      seoSchema: arrSchema.join(','),
      pageContent: pageContent,
      breadcrumbs: breadcrumbs,
      menuHeader: menuHeader,
      menuFooter: menuFooter,
      menuFooterRight: menuFooterRight
    };
    var renderText = `web/${pageContent.slug}`;
    res.render(renderText, { page: page });
  } catch (err) {
    return errorController.render500(req, res);
  }
};

// Xử lý tập hợp URL của Apk / Post / Page
async function execPostPage(req, res) {
  try {
    var userRole = req.session.role;
    var comments = [];
    var countComments = 0;
    var countCommentsAll = 0;
    var ratingLines = [];
    var curLang = req.curLang;
    var postId = req.pageContent.id;
    var pageContent = req.pageContent;
    var userid = req.session.userid || '';
    if (pageContent.notenglish == true && curLang.ismain) {
      return errorController.render404(req, res);
    }
    pageContent = !curLang.ismain ? functions.postMaping(pageContent) : pageContent;
    var curUrl = req.url;
    curUrl = curUrl.replace(`/${curLang.id}`, '');
    var menuHeader = await menuController.getMenuFontEnd(
      curLang,
      'menu-header',
      'post',
      postId,
      curUrl,
      pageContent.notenglish
    );
    var menuFooter = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer',
      'post',
      postId,
      curUrl
    );
    var menuFooterRight = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer-right',
      'post',
      postId,
      curUrl
    );
    var breadcrumbs = await breadcumbController.createBreadcumb(
      4,
      curLang,
      pageContent.title,
      req.url
    );
    // role
    var role = await Roles.findOne({
      where: {
        rolename: "Administrator"
      },
    });
    // SEO Meta tags
    var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
    var seoTitle = pageContent.seotitle == '' ? pageContent.title : pageContent.seotitle;
    var seoDescription = pageContent.seodescription == '' ? pageContent.description : pageContent.seodescription;
    var homePage = await postController.getPostByLangAndSlugAttr('home', curLang);
    homePage = !curLang.ismain ? functions.postMaping(homePage) : homePage;
    var imgRectangle = pageContent.thumb || {};
    var imgRectangleUrl = imgRectangle.url ? imgRectangle.url : '';
    var imgSquare = pageContent.icon || {};
    var imgSquareUrl = imgSquare.url ? imgSquare.url : imgRectangleUrl;
    var defcateid = pageContent.dcateid || null;
    if (defcateid == null) {
      // Đã khai báo category nhưng chưa cập nhật default category ID vào POST
      defcateid = await Category.getCateMinHirarchyLevel(pageContent.id);
      defcateid = defcateid ? defcateid : 1; // Nếu chưa khai báo Category cho POST thì cho về 1 = Uncategory
      defcateid = pageContent.posttype == 'post-page' ? null : defcateid; // Nếu chưa khai báo Category cho POST thì cho về 1 = Uncategory
    }
    var hierarchyCate = await Category.findAllParentsSEO(defcateid, curLang.id);
    hierarchyCate = hierarchyCate ? hierarchyCate : [];
    var currentCategory = hierarchyCate.length > 0 ? hierarchyCate[hierarchyCate.length - 1] : {};
    var pageSeoObject = {
      pagetype: 'article',
      seotitle: seoTitle,
      seodescription: seoDescription,
      index: pageContent.allowindex || false,
      follow: pageContent.allowfollow || false,
      publishat: pageContent.publishedat ? pageContent.publishedat : pageContent.createdAt,
      modifyat: pageContent.updatedAt,
      thumb: imgRectangle,
      icon: imgSquare,
      author: pageContent.author || '0',
      name: pageContent.title,
      category: hierarchyCate.length > 0 ? hierarchyCate[0].title : '',
      subcategory: currentCategory.title || '',
      comment: pageContent.commentcount || 0,
      notenglish: pageContent.notenglish,
    };
    var metaPost = [];
    metaPost = await seometa.postMeta(curLang, req.url, pageSeoObject, arrLangsExists);
    // SEO schema structure
    var arrSchema = [];
    arrSchema.push(await schema.Organization(curLang, req.languages, homePage));
    arrSchema.push(await schema.WebSite(curLang));
    //arrSchema.push(await schema.ImageObject(curLang, req.url, imgSquare));
    var person = {
      id: pageContent.Author.id || '0',
      name: `${pageContent.Author.lastname} ${pageContent.Author.firstname}`,
      description: `${pageContent.Author.lastname} ${pageContent.Author.firstname}`,
      avatar: pageContent.Author.avatar || '',
    };
    var renderText = 'web/single';
    var catesSidebar = [];
    var apkSidebar = [];
    var apkYouLike = [];
    var apkMeta = {};
    var apkMod = {};
    var faqs = [];
    var imgs = [];
    var appsSidebar = [];
    var rootCateSlug = 'games';
    var rootAppSlug = 'apps';
    catesSidebar = await cateController.getCategoryByLangParentSlug(rootCateSlug, curLang);
    appsSidebar = await cateController.getCategoryByLangParentSlug(rootAppSlug, curLang);

    var $ = cheerio.load(pageContent.content, null, false);
    $('.sm-single-content-image').each(function (i, el) {
      let src = $(el).find('>img').attr('src') || '';
      if (src.length > 0) imgs.push({ url: src });
    });
    var toc = {};
    if (pageContent.posttype == 'post-blog' || pageContent.posttype == 'post-apk') {
      var ads = pageContent.Ads ? pageContent.Ads : {};
      var offadscontent = pageContent.offadscontent ? pageContent.offadscontent : false;
      offadscontent = pageContent.offads ? pageContent.offads : offadscontent;
      offadscontent = pageContent.offadsall ? pageContent.offadsall : offadscontent;
      toc = tocController.tableOfContents(pageContent.content, ads, offadscontent);
      pageContent.content = toc.content || pageContent.content;
      if (toc.schema && toc.schema.length > 0) {
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        var tocSchema = await schema.createTocSchema(toc.schema, fullUrl);
        if (tocSchema && tocSchema.length > 0) arrSchema.push(tocSchema);
      }
      comments = await commentController.getListCommentByPostid(
        curLang.id,
        pageContent.id,
        1,
        ''
      );
      ratingLines = await commentController.getLineRating(pageContent.id, curLang.id);
      var dataCreativeWorkSeries = {
        ratingLines: ratingLines,
        reviews: comments,
        title: pageContent.title || '',
      };
      if (ratingLines.point > 0)
        arrSchema.push(await schema.CreativeWorkSeries(dataCreativeWorkSeries));
      faqs = await Apkfaq.findAll({
        where: {
          postid: postId,
          langid: curLang.id,
        },
        order: [['numsort', 'DESC']],
      });
      if (faqs.length > 0) arrSchema.push(await schema.FAQs(faqs));
      // APK Template
      if (pageContent.posttype == 'post-apk') {
        renderText = 'web/single-apk';
        apkYouLike = await postController.getRelatedApk(
          'new',
          pageContent.id,
          pageContent.dcateid,
          curLang,
          1,
          10
        );
        apkMeta = await Apkmeta.findOne({ where: { postid: pageContent.id } });
        var screenshoots = [];
        if (apkMeta.show_slide) {
          var pss = await Post.findOne({
            where: {
              id: pageContent.id,
            },
            attributes: [],
            include: {
              model: Media,
              as: 'screenshoots',
              attributes: ['url'],
              through: {
                attributes: [],
              },
              required: true,
            },
          });
          screenshoots = pss && pss.screenshoots ? pss.screenshoots : [];
        }
        apkMod = await Apkmod.findOne({
          where: {
            showinsingle: true,
            apkid: apkMeta.id,
            isoriginal: false,
          },
          order: [['numsort', 'DESC']],
        });
        apkMod = apkMod ? apkMod : {};
        var app = {
          title: pageContent.title,
          slug: pageContent.slug || '',
          seotitle: pageContent.seotitle || pageContent.title || '',
          seodescription: pageContent.seodescription || pageContent.description || '',
          category: hierarchyCate.length > 0 ? hierarchyCate[0].title : '',
          subcategory: currentCategory.title || '',
          publishat: pageSeoObject.publishat,
          modifyat: pageSeoObject.modifyat,
          imgRectangle: imgRectangleUrl, // hình vuông
          imgSquare: imgSquareUrl, // hình vuông
          developerName: apkMeta.developer_name || '',
          os: apkMeta.os ? apkMeta.os : '',
          version: apkMeta.version ? apkMeta.version : '',
          price: apkMeta.price ? apkMeta.price : 0,
          ccy: apkMeta.ccy ? apkMeta.ccy : 'USD',
          fileSize: apkMeta.apk_size || '',
          comment: pageSeoObject.comment,
          screenshoots: screenshoots.length > 0 ? screenshoots : imgs,
          rate: {
            total: pageContent.ratingcount ? pageContent.ratingcount : 1,
            average: pageContent.ratingaverage
              ? parseFloat(pageContent.ratingaverage).toFixed(1)
              : 0,
          },
          ratingLines: ratingLines,
          reviews: comments.rows ? comments.rows : [],
        };
        arrSchema.push(await schema.MobileApplication(curLang, req.url, app));
        //log view page -> sort apk popular
        req.postId = pageContent.id;
        await interActiveController.AddViewPage(req, res);
      }
      // Blog template
      if (pageContent.posttype == 'post-blog') {
        renderText = 'web/single';
        var cateIds = await Category.getTagsOfPost(pageContent.id, 'tags');
        if (cateIds.length <= 0) cateIds.push(pageContent.dcateid);
        apkYouLike = await postController.getRelatedPost(
          'new',
          pageContent.id,
          pageContent.dcateid,
          curLang,
          1,
          maxNumPostsHome
        );
        pageSeoObject.screenshoots = imgs || [];
        pageSeoObject.ratingLines = ratingLines;
        pageSeoObject.reviews = comments.rows ? comments.rows : [];
        arrSchema.push(await schema.Article(curLang, req.url, pageSeoObject));
      }
      arrSchema.push(await schema.Person(curLang, person));
    }
    // Page Template
    if (pageContent.posttype == 'post-page') {
      renderText = pageContent.template ? `web/${pageContent.template}` : 'web/single-page';
    }
    var breadcrumbs = await breadcumbController.createBreadcumb(
      defcateid,
      curLang,
      pageContent.title,
      req.url,
      res.__('textHome'),
      hierarchyCate
    );
    if (breadcrumbs && breadcrumbs.schema) {
      arrSchema.push(breadcrumbs.schema);
    }
    /* if(req.session.userid){
            await commentController.offNotificationComment(req.session.userid, pageContent.id);            
        } */
    if (pageContent.seoschema && pageContent.seoschema.length > 0) {
      arrSchema.push(pageContent.seoschema);
    }
    // Get Tags of Posts
    var postTags = await Post.findOne({
      where: {
        id: pageContent.id,
      },
      attributes: ['id', 'title'],
      include: {
        model: Category,
        as: 'tags',
        attributes: ['id', 'title', 'slug', 'fullslug'],
        where: {
          catetype: 'tags',
          catestatus: 'published',
        },
        required: true,
      },
    });
    var tags = postTags && postTags.tags ? postTags.tags : [];
    var page = {
      curLang: curLang,
      seoMeta: metaPost.join(''),
      seoSchema: arrSchema.join(','),
      pageContent: pageContent,
      apkMeta: apkMeta,
      apkMod: apkMod,
      faqs: faqs,
      breadcrumbs: breadcrumbs,
      menuHeader: menuHeader,
      menuFooter: menuFooter,
      menuFooterRight: menuFooterRight,
      catesSidebar: catesSidebar,
      appsSidebar: appsSidebar,
      apkSidebar: apkSidebar,
      apkYouLike: apkYouLike,
      comments: comments,
      countComments: countComments,
      countCommentsAll: countCommentsAll,
      ratingLines: ratingLines,
      screenshoots: screenshoots,
      toc: toc.toc || [],
      tags: tags ? tags : [],
      userRole: userRole,
      role: role
    };
    res.render(renderText, { page: page });
  } catch (err) {
    console.log(err);
    return errorController.render500(req, res);
  }
}

// Done
// Xử lý tập hợp URL của Category
async function execCategoryPage(req, res) {
  try {
    var userRole = req.session.role;
    var curPage = req.params.page ? parseInt(req.params.page) : 1,
      curLang = req.curLang,
      curUrl = req.url,
      rootUrl = curUrl,
      numPage = req.params.page || 1,
      pageContent = req.pageContent;
    pageContent = !curLang.ismain ? functions.cateMaping(pageContent) : pageContent;
    var type = await Type.findOne({
      where: {
        id: pageContent.catetype,
        isblock: false,
      },
    });
    type = type ? type : {};
    var checkUrl = `/${curLang.ismain ? '' : curLang.id + '/'}${type.roottext.length > 0 ? type.roottext + '/' : ''}${pageContent.fullslug}${type.exttext}`;
    var acceptUrl = req.url;
    var arr = acceptUrl.split('?');
    acceptUrl = arr.length >= 1 ? arr[0] : acceptUrl;
    //acceptUrl = acceptUrl.replace(/\/page\/\d*$/g, '');
    acceptUrl = acceptUrl.replace(/\/$|\/page\/\d*$/g, '');
    var sort = req.query.sort || 'updated';
    var sortArr = ['new', 'updated', 'popular'];
    if (!sortArr.includes(sort)) {
      exec404Page(req, res);
      return;
    }
    if (checkUrl !== acceptUrl) {
      exec404Page(req, res);
      return;
    }
    if (curUrl.match(/\/page\/\d*/g)) {
      let arr = curUrl.split('/');
      curPage = parseInt(arr[arr.length - 1]);
      rootUrl = curUrl.replace(/\/page\/\d*/g, '');
    }
    var menuHeader = await menuController.getMenuFontEnd(
      curLang,
      'menu-header',
      'cate',
      pageContent.id,
      curUrl
    );
    var menuFooter = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer',
      'cate',
      pageContent.id,
      curUrl
    );
    var menuFooterRight = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer-right',
      'cate',
      pageContent.id,
      curUrl
    );
    // Get Data Apk
    var cateSelectionIds = await Category.findAllChildIds(pageContent.id);
    cateSelectionIds = cateSelectionIds.map((id) => parseInt(id));
    cateSelectionIds.push(pageContent.id);
    var apkNewUpdate = [];
    var catesSidebar = [];
    var appsSidebar = [];
    var apkSidebarLast = [];
    var apkSidebarPop = [];
    var apkSidebar = [];
    var cateType = pageContent.catetype;
    var renderText = 'web/archive';
    renderText = cateType == 'category-apk' ? 'web/archive-apk' : renderText;
    renderText = cateType == 'developer-apk' ? 'web/archive-dev' : renderText;
    if (cateType == 'category-apk' || cateType == 'developer-apk') {
      apkNewUpdate = await postController.getApkByCateIdsLangHasSort(
        sort,
        cateSelectionIds,
        curLang,
        numPage,
        maxNumPostsCate
      );
      var rootCateSlug = 'games';
      var rootAppSlug = 'apps';
      var arrRCS = rootCateSlug.split('/');
      rootCateSlug = arrRCS[0] ? arrRCS[0] : rootCateSlug;
      rootCateSlug = cateType == 'category-apk' ? [rootCateSlug] : [gameSlug, appSlug];
      catesSidebar = await cateController.getCategoryByLangParentSlug(rootCateSlug, curLang);
      appsSidebar = await cateController.getCategoryByLangParentSlug(rootAppSlug, curLang);

    } else if (cateType == 'tags') {
      renderText = 'web/archive-tag';
      apkNewUpdate = await postController.getAllPostByCateIdsLangHasSort(
        'new',
        cateSelectionIds,
        curLang,
        numPage,
        maxNumPostsCate
      );
    } else {
      apkNewUpdate = await postController.getPostByCateIdsLangHasSort(
        'new',
        cateType,
        cateSelectionIds,
        curLang,
        numPage,
        maxNumPostsCate
      );
      //apkSidebar = await postController.getPostByCateIdsLangHasSort("popular", cateType, cateSelectionIds, curLang, 1, maxNumPostsSidebar);
      //catesSidebar = await cateController.getCategoryByLangCatetype(pageContent.catetype, curLang);
    }
    var maxPage = apkNewUpdate.maxPage || 0;
    // SEO Meta tags
    var arrLangsExists = await Category.findCateLangAvailable(curLang.id, pageContent.id);
    var seoTitle = pageContent.seotitle == '' ? pageContent.title : pageContent.seotitle;
    var seoDescription =
      pageContent.seodescription == '' ? pageContent.description : pageContent.seodescription;
    var homeSeoObject = {
      pagetype: 'object',
      cateslug: pageContent.slug,
      seotitle: seoTitle,
      seodescription: seoDescription,
      index: pageContent.allowindex || false,
      follow: pageContent.allowfollow || false,
      publishat: pageContent.createdAt,
      modifyat: pageContent.updatedAt,
    };
    var metaCate = [];
    metaCate = await seometa.cateMeta(
      curLang,
      req.url,
      homeSeoObject,
      arrLangsExists,
      rootUrl,
      curPage,
      maxPage
    );
    // role
    var role = await Roles.findOne({
      where: {
        rolename: "Administrator"
      },
    });
    // SEO schema structure
    var homePage = await postController.getPostByLangAndSlugAttr('home', curLang);
    homePage = !curLang.ismain ? functions.postMaping(homePage) : homePage;
    var arrSchema = [];
    arrSchema.push(await schema.Organization(curLang, req.languages, homePage));
    //arrSchema.push(await schema.WebSite(curLang, seoDescriptionHome)); // seoDescription của home
    arrSchema.push(await schema.WebSite(curLang));
    arrSchema.push(await schema.CollectionPage(curLang, rootUrl, homeSeoObject));
    // SEO breadcumb & pagination
    var pagination = await paginationController.createPagination(rootUrl, curPage, maxPage);
    var breadcrumbs = await breadcumbController.createBreadcumb(
      pageContent.id,
      curLang,
      null,
      req.url,
      res.__('textHome')
    );
    if (breadcrumbs && breadcrumbs.schema) {
      arrSchema.push(breadcrumbs.schema);
    }
    var page = {
      curLang: curLang,
      seoMeta: metaCate.join(''),
      seoSchema: arrSchema.join(','),
      pageContent: pageContent,
      menuHeader: menuHeader,
      menuFooter: menuFooter,
      menuFooterRight: menuFooterRight,
      apkNewUpdate: apkNewUpdate,
      apkSidebar: apkSidebar,
      apkSidebarLast: apkSidebarLast,
      apkSidebarPop: apkSidebarPop,
      catesSidebar: catesSidebar,
      appsSidebar: appsSidebar,
      pagination: pagination,
      breadcrumbs: breadcrumbs,
      sort: sort,
      userRole: userRole,
      role: role
    };
    res.render(renderText, { page: page });
  } catch (err) {
    console.log(err);
    return errorController.render500(req, res);
  }
}

// Done
// Xử lý tập hợp URL của ringtones
async function execRingtonesPage(req, res) {
  try {
    var pageContent = req.pageContent,
      ringtones = {},
      curPage = req.params.page ? parseInt(req.params.page) : 1,
      cateid = req.cateid,
      curLang = req.curLang,
      numRows = 18,
      offset = numRows * curPage - numRows,
      curUrl = req.url,
      rootUrl =
        curLang.ismain == true ? `${domain}/ringtones` : `${domain}/${curLang.id}/ringtones`;
    pageContent = !curLang.ismain ? functions.postMaping(pageContent) : pageContent;
    var sort = req.query.sort || 'top';
    var sortArr = ['new', 'top', 'popular'];
    if (!sortArr.includes(sort)) {
      exec404Page(req, res);
      return;
    }
    var order = [];
    switch (sort) {
      case 'popular':
        order.push(['numvotes', 'desc']);
        break;
      case 'new':
        order.push(['id', 'desc']);
        break;
      default:
        order.push(['numdownload', 'desc']);
        break;
    }
    ringtones = await Ringtone.findAndCountAll({
      where: {
        postid: {
          [Op.like]: cateid,
        },
      },
      order: order,
      offset: offset,
      limit: numRows,
    });
    var maxPage = Math.ceil(ringtones.count / numRows);
    ringtones.maxPage = maxPage;
    ringtones.curPage = curPage;
    var ringcates = await postController.getRingtoneCatesByLang(curLang);
    if (cateid != '%') {
      rootUrl = `${rootUrl}/${pageContent.slug}`;
    }
    //var curUrl = req.url;
    curUrl = curUrl.replace(new RegExp(`^\/${curLang.id}`, 'g'), '');
    //curUrl = (sort!="new") ? `${curUrl}?sort=${curUrl}` : curUrl;
    var menuHeader = await menuController.getMenuFontEnd(
      curLang,
      'menu-header',
      'post',
      pageContent.id,
      curUrl
    );
    var menuFooter = await menuController.getMenuFontEnd(
      curLang,
      'menu-footer',
      'post',
      pageContent.id,
      curUrl
    );
    // SEO Meta tags
    var arrLangsExists = await Post.findPostLangAvailable(curLang.id, pageContent.id);
    var seoTitle = pageContent.seotitle == '' ? pageContent.title : pageContent.seotitle;
    var seoDescription =
      pageContent.seodescription == '' ? pageContent.description : pageContent.seodescription;
    var homePage = await postController.getPostByLangAndSlugAttr('home', curLang);
    homePage = !curLang.ismain ? functions.postMaping(homePage) : homePage;
    var homeSeoObject = {
      pagetype: 'article',
      seotitle: seoTitle,
      seodescription: seoDescription,
      index: pageContent.allowindex || false,
      follow: pageContent.allowfollow || false,
      publishat: pageContent.publishedat ? pageContent.publishedat : pageContent.createdAt, //new Date().toISOString(pageContent.publishedat)
      modifyat: pageContent.updatedAt,
    };
    var metaCate = [];
    var metaUrl = req.url.replace(/\/page\/.*/g, '');
    metaCate = await seometa.cateMeta(
      curLang,
      req.url,
      homeSeoObject,
      arrLangsExists,
      metaUrl,
      curPage,
      maxPage
    );
    // SEO schema structure
    var arrSchema = [];
    //arrSchema.push(await schema.WebSite(curLang, seoDescriptionHome)); // seoDescription của home
    arrSchema.push(await schema.WebSite(curLang));
    // SEO breadcumb & pagination
    var pagination = [];
    pagination = await paginationController.createPagination(curUrl, curPage, maxPage);
    var ringtonesPage = null;
    if (pageContent.posttype == 'post-ringstone') {
      ringtonesPage = await postController.getPostByLangSlugPosttype2(
        'ringtones',
        curLang,
        'post-page'
      );
      ringtonesPage = !curLang.ismain ? functions.postMaping(ringtonesPage) : ringtonesPage;
    }
    var breadcrumbs = await breadcumbController.createBreadcumbRingtones(
      ringtonesPage,
      pageContent,
      curLang,
      req.url,
      res.__('textHome')
    );
    if (breadcrumbs && breadcrumbs.schema) {
      arrSchema.push(breadcrumbs.schema);
    }
    var rs = {
      curLang: curLang,
      rootUrl: rootUrl,
      seoMeta: metaCate.join(''),
      seoSchema: arrSchema.join(','),
      pageContent: pageContent,
      ringtones: ringtones,
      ringcates: ringcates,
      pagination: pagination,
      breadcrumbs: breadcrumbs,
      menuHeader: menuHeader,
      menuFooter: menuFooter,
      sort: sort,
    };
    res.render('web/ringtones', { page: rs });
  } catch (err) {
    console.log(err);
    return errorController.render500(req, res);
  }
}

// Xử lý chức năng preview page
async function execPreviewPage(req, res) {
  try {
    if (!req.session.role) {
      return errorController.render404(req, res);
    }
    var postId = req.query.pid || 0;
    var post = await postController.getPostPreViewMode(postId, req.curLang);
    if (post) {
      post.allowindex = false;
      post.allowfollow = false;
      post.offads = true;
      req.pageContent = post;
      await execPostPage(req, res);
      return;
    } else {
      return errorController.render404(req, res);
    }
  } catch (err) {
    return errorController.render500(req, res);
  }
}

// Trang báo lỗi 404
async function exec404Page(req, res) {
  return errorController.render404(req, res);
}
