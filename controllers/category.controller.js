const db = require('../models');
const { createRedirectWhenChangeSlug } = require('./redirect.controller');
const config = require('config');
const cfTable = config.get('database.table');
const tbCategoryName = cfTable.prefix.concat('categories');
const tbCatePostName = cfTable.prefix.concat('post_cates');
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Type = db.type;
const Category = db.category;
const CateLang = db.catelang;
const Language = db.language;
const Ads = db.ads;
const Menuitem = db.menuitem;
const User = db.user;
const tracerController = require('./tracer.controller');
const errorController = require('./error.controller');

// Hien thi trang List Category
exports.ListCategory = async (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actview) {
      return errorController.render403(req, res);
    }
    var catetype = req.params.catetype || '';
    var type = await Type.findOne({
      where: { id: catetype },
      include: {
        model: Type,
        as: 'posttype',
        attributes: ['id', 'name', 'allowindex', 'allowfollow'],
        through: {
          attributes: [],
        },
      },
    });
    if (type == null) {
      return errorController.render404(req, res);
    }
    var categories = await Category.findAll({
      where: {
        [Op.and]: [
          {
            catetype: catetype,
            parentid: {
              [Op.eq]: null,
            },
          },
        ],
      },
      limit: 10,
    });
    var adss = await Ads.findAll({
      where: {
        isblock: false,
      },
      attributes: ['id', 'name'],
    });
    res.render('admin/category', { type, categories, adss, catetype });
  } catch (err) {
    return errorController.render500(req, res);
  }
};
// Hien thi trang Edit Category
exports.GetEditCategory = async (req, res) => {
  try {
    var id = req.params.id || '',
      catetype = req.params.catetype || '';
    const category = await Category.findOne({
      where: {
        id: id,
      },
      include: [
        {
          model: db.catelang,
          as: 'CateLang',
          include: [
            {
              model: db.language,
              as: 'Lang',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });
    // Khong co Category nay
    if (category == null) {
      return errorController.render404(req, res);
    }
    // Check quyen Edit hoac Author
    if (category.author !== req.session.userid) {
      if (!req.roleAction || !req.roleAction.actedit) {
        return errorController.render403(req, res);
      }
    }
    const type = await Type.findOne({
      where: { id: catetype },
      attributes: ['id', 'name'],
      include: {
        model: Type,
        as: 'posttype',
        attributes: ['id', 'name', 'allowindex', 'allowfollow'],
        through: {
          attributes: [],
        },
      },
    });
    // Khong co Loai Category nay
    if (type == null) {
      return errorController.render404(req, res);
    }
    // Cac phien bang ngon da tao cua category
    var langs = [];
    category.CateLang.forEach((catelang) => {
      langs.push(catelang.langid);
    });
    // Cac ngon ngu khac ma site ho tro
    const languages = await Language.findAll({
      where: {
        [Op.and]: {
          isblock: {
            [Op.eq]: false,
          },
          ismain: {
            [Op.eq]: false,
          },
          id: {
            [Op.notIn]: langs,
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
    // Danh sach categories cap 1 khac category dang sua
    categories = await Category.findAll({
      where: {
        [Op.and]: [
          {
            catetype: catetype,
            parentid: {
              [Op.eq]: null,
            },
            id: {
              [Op.ne]: category.id,
            },
          },
        ],
      },
    });
    var tracer = await tracerController.getTracking('category', category.id);
    res.render('admin/category-edit', {
      type,
      categories,
      category,
      languages,
      adss,
      catetype,
      tracer,
    });
  } catch (err) {
    return errorController.render500(req, res);
  }
};
// Lay thong tin cua 1 Category
exports.findOne = async (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actview) {
      return errorController.render403Ajax(req, res);
    }
    var id = req.query.id || req.body.id || req.params.id || '';
    const data = await Category.findOne({
      where: {
        [Op.and]: [
          {
            id: id,
            catetype: req.params['catetype'],
          },
        ],
      },
    });
    if (data != null) {
      return res.json({ code: 1, data });
    }
    return res.json({ code: 0, message: 'Category not exist' });
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};
// Ajax submit modal add category
exports.AddCategory = async (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actadd) {
      return errorController.render403Ajax(req, res);
    }
    var islikemain = req.body.islikemain;
    islikemain = islikemain == 'on' ? true : false;
    var offads = req.body.offads;
    offads = offads == 'on' ? true : false;
    var offadsall = req.body.offadsall;
    offadsall = offadsall == 'on' ? true : false;
    var allowfollow = req.body.allowfollow;
    allowfollow = allowfollow == 'on' ? true : false;
    var allowindex = req.body.allowindex;
    allowindex = allowindex == 'on' ? true : false;
    var devSeoTitle = `Navegue por apps e jogos do ${req.body.title}`;
    var devSeoDesc = `Você gosta de apps e jogos do ${req.body.title}? Fique à vontade para navegar por outros apps e jogos criados por ele nesta seção. Desfrute de inúmeros aplicativos com uma vibe similar.`;
    var seotitle = req.body.seotitle || '';
    seotitle =
      seotitle === '' || seotitle === null || seotitle === undefined ? devSeoTitle : seotitle;
    var seodescription = req.body.seodescription || '';
    seodescription =
      seodescription === '' || seodescription === null || seodescription === undefined
        ? devSeoDesc
        : seodescription;
    // Chuyen title thanh SLUG
    var slug = req.body.slug;
    if (slug === '' || slug === null || slug === undefined) {
      slug = functions.convert_slug(req.body.title);
    }
    var adsId = req.body.ads ? req.body.ads : null;
    var slot1 = (slot2 = slot3 = slot4 = '');
    // Lay ma Ads mac dinh neu khong set Ads khi them
    var defaultAds = await Ads.findOne({
      where: { id: adsId },
      attributes: ['id', 'slot1', 'slot2', 'slot3', 'slot4'],
    });
    if (defaultAds) {
      slot1 = defaultAds.slot1;
      slot2 = defaultAds.slot2;
      slot3 = defaultAds.slot3;
      slot4 = defaultAds.slot4;
    }
    // Lay thong tin category parent da chon
    var parentId = req.body.parent ? req.body.parent : '';
    const parentCate = await Category.findOne({
      where: { id: parentId },
      attributes: ['id', 'slug', 'hirarchylevel'],
    });
    var hirarchylevel = parentCate ? parentCate.hirarchylevel + 1 : 1;
    await Category.create({
      slug: slug,
      fullslug: parentCate ? `${parentCate.slug}/${slug}` : slug, //SLUG da cap cho category
      title: req.body.title,
      description: req.body.description,
      seotitle: seotitle,
      seodescription: seodescription,
      icon: req.body.icon || '',
      catetype: req.params['catetype'],
      islikemain: islikemain,
      offads: offads,
      offadsall: offadsall,
      allowfollow: allowfollow,
      allowindex: allowindex,
      parentid: parentCate ? parentCate.id : null,
      adsid: adsId,
      adsslot1: slot1,
      adsslot2: slot2,
      adsslot3: slot3,
      adsslot4: slot4,
      catestatus: req.body.catestatus,
      hirarchylevel: hirarchylevel,
      author: req.session.userid ? req.session.userid : null,
    })
      .then(async (cate) => {
        // add log Add
        await tracerController.addTracking(
          req.ipAddr,
          req.userAgent,
          req.session.userid,
          'category',
          cate.id,
          'add',
          `Add ${cate.title}`
        );
        res.json({ code: 1, message: 'Category was created successfully' });
      })
      .catch(() => {
        res.json({ code: 0, message: 'Category was created error' });
      });
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};
// Submit edit Category
exports.EditCategory = async (req, res) => {
  try {
    var islikemain = req.body.islikemain;
    islikemain = islikemain == 'on' ? true : false;
    var offads = req.body.offads;
    offads = offads == 'on' ? true : false;
    var offadsall = req.body.offadsall;
    offadsall = offadsall == 'on' ? true : false;
    var allowfollow = req.body.allowfollow;
    allowfollow = allowfollow == 'on' ? true : false;
    var allowindex = req.body.allowindex;
    allowindex = allowindex == 'on' ? true : false;
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
    var parentid = req.body.parent;
    parentid = parentid === '' || parentid === undefined ? null : parseInt(parentid);
    var adsid = req.body.ads;
    adsid = adsid === '' || adsid === undefined ? null : parseInt(adsid);
    var id = req.body.id;
    const curCate = await Category.findOne({
      where: { id: id },
      attributes: ['id', 'parentid', 'adsid', 'fullslug', 'slug', 'author'],
    });
    // Category khong ton tai
    if (curCate == null) {
      return errorController.render404Ajax(req, res);
    }
    // Check quyen Edit hoac Author
    if (curCate.author !== req.session.userid) {
      if (!req.roleAction || !req.roleAction.actedit) {
        return errorController.render403Ajax(req, res);
      }
    }
    var hirarchylevel = curCate ? curCate.hirarchylevel : 1;
    var listChildCates = [];
    var objectlangs = '';
    var flagMenuUpdate = false;
    var fullslug = curCate.fullslug;
    var oldSlug = fullslug;
    var newSlug = fullslug;
    if (curCate.parentid != parentid || curCate.slug != slug) {
      // Cập nhật fullslug cho tất cả các cate con và chính nó
      var pCate = await Category.findOne({
        where: { id: parentid },
        attributes: ['id', 'fullslug', 'hirarchylevel'],
      });
      fullslug =
        pCate != null && pCate.fullslug != null && pCate.fullslug != ''
          ? pCate.fullslug.concat('/', slug)
          : slug;
      newSlug = fullslug;
      listChildCates = await Category.findAllChildIds(curCate.id);
      objectlangs = await Category.findCateLangAvailableFullText(curCate.id);
      flagMenuUpdate = true;
      hirarchylevel = pCate ? pCate.hirarchylevel + 1 : 1;
    }
    var slot1 = adsid != null ? curCate.adsslot1 : '',
      slot2 = adsid != null ? curCate.adsslot2 : '',
      slot3 = adsid != null ? curCate.adsslot3 : '',
      slot4 = adsid != null ? curCate.adsslot4 : '';
    if (curCate.adsid != adsid && adsid !== null) {
      // Cập nhật lại các trường adsslot theo mã ads mới
      const ads = await Ads.findOne({
        where: { id: adsid },
        attributes: ['id', 'slot1', 'slot2', 'slot3', 'slot4'],
      });
      if (ads) {
        slot1 = ads.slot1;
        slot2 = ads.slot2;
        slot3 = ads.slot3;
        slot4 = ads.slot4;
      }
    }
    // Thuc hien lenh update
    const updatedCate = await Category.update(
      {
        slug: slug,
        fullslug: fullslug,
        title: req.body.title,
        description: req.body.description,
        seotitle: seotitle,
        seodescription: seodescription,
        icon: req.body.icon || '',
        catetype: req.params['catetype'],
        islikemain: islikemain,
        offads: offads,
        offadsall: offadsall,
        allowfollow: allowfollow,
        allowindex: allowindex,
        parentid: parentid,
        adsid: adsid,
        adsslot1: slot1,
        adsslot2: slot2,
        adsslot3: slot3,
        adsslot4: slot4,
        catestatus: req.body.catestatus,
        hirarchylevel: hirarchylevel,
      },
      {
        where: {
          id,
        },
      }
    );
    // Neu update thanh cong
    if (updatedCate == 1) {
      // add log Edit
      await tracerController.addTracking(
        req.ipAddr,
        req.userAgent,
        req.session.userid,
        'category',
        id,
        'edit',
        `Edit ${req.body.title}`
      );
      // Cap nhat menu item ney category dang sua la mot item menu
      if (curCate.islikemain != islikemain) {
        objectlangs = await Category.findCateLangAvailableFullText(curCate.id);
        flagMenuUpdate = true;
      }
      if (flagMenuUpdate) {
        await Menuitem.update(
          {
            objectslug: fullslug,
            alllanguage: islikemain,
            objectlangs: objectlangs,
          },
          {
            where: {
              objectid: curCate.id,
              type: 'category',
            },
          }
        );
      }
      // Auto them redirect khi slug (permalink) thay doi
      var author = req.session.userid ? req.session.userid : null;
      if (oldSlug != newSlug) {
        await createRedirectWhenChangeSlug('category', '301', oldSlug, newSlug, author);
      }
      // Cap nhat fullslug va menu item cho tat ca cac category con cua category dang update
      var listChildCates2 = await Category.findAll({
        where: {
          id: listChildCates,
        },
      });
      listChildCates2.forEach(async (childCate) => {
        var oldSlug = childCate.fullslug;
        var newSlug = `${fullslug}/${childCate.slug}`;
        childCate.fullslug = newSlug;
        childCate.save();
        if (oldSlug != newSlug) {
          await createRedirectWhenChangeSlug('category', '301', oldSlug, newSlug, author);
        }
        // Menu item cua category con
        await Menuitem.update(
          {
            objectslug: newSlug,
          },
          {
            where: {
              objectid: childCate.id,
              type: 'category',
            },
          }
        );
      });
      return res.json({ code: 1, message: 'Category was updated successfully' });
    } else {
      return res.json({ code: 0, message: 'Category was updated error' });
    }
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};
// Delete Catrgory
exports.DeleteCategory = async (req, res) => {
  try {
    var id = req.params.id || req.body.id || req.query.id || '',
      catetype = req.params.catetype,
      where = {
        id: id,
        catetype: catetype,
      };
    if (!req.roleAction || !req.roleAction.actdel) {
      where.author = req.session.userid || '';
    }
    var rsDelete = await Category.destroy({
      where: where,
    });
    if (rsDelete <= 0) {
      return res.json({ code: 0, message: "Category can't delete" });
    }
    await Menuitem.destroy({
      where: {
        objectid: id,
        type: 'category',
      },
    });
    var lcate = await Category.findAll({
      where: where,
      attributes: ['id', 'title'],
    });
    // add tracer
    lcate.forEach(async (c) => {
      await tracerController.addTracking(
        req.ipAddr,
        req.userAgent,
        req.session.userid,
        'category',
        c.id,
        'delete',
        `Delete ${c.title}`
      );
    });
    return res.json({ code: 1, message: 'Category was deleted successfully' });
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};
// Bulk action List Catrgories
exports.BulkCategory = async (req, res) => {
  try {
    var id = req.body.id || '',
      action = req.body.action || '',
      catetype = req.params.catetype || '',
      where = {
        id: id,
        catetype: catetype,
      };
    if (!req.roleAction || !req.roleAction.actedit) {
      where.author = req.session.userid || '';
    }
    if (action == 'delete') {
      this.DeleteCategory(req, res);
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
      var rsUpdate = await Category.update(
        {
          catestatus: status,
        },
        {
          where: where,
        }
      );
      if (rsUpdate <= 0) {
        return res.json({ code: 0, message: `Categories can't ${action}` });
      }
      var lcate = await Category.findAll({
        where: where,
        attributes: ['id', 'title'],
      });
      // add tracer
      lcate.forEach(async (c) => {
        await tracerController.addTracking(
          req.ipAddr,
          req.userAgent,
          req.session.userid,
          'category',
          c.id,
          action,
          `${action} ${c.title}`
        );
      });
      return res.json({ code: 1, message: `Categories were ${action} successfully` });
    }
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};
// Phan trang Category
exports.Datatable = async (req, res) => {
  var where = {},
    column = 'id',
    catetype = req.params.catetype || '';
  var search = req.query.columns[1].search.value;
  var parentid = req.query.columns[2].search.value;
  parentid = parentid == '' ? '%' : parentid;
  var adsid = req.query.columns[3].search.value;
  adsid = adsid == '' ? '%' : adsid;
  var catestatus = req.query.columns[4].search.value;
  catestatus = catestatus == '' ? '%' : catestatus;
  var type = await Type.findOne({
    where: {
      id: catetype,
    },
  });
  if (type == null) {
    return errorController.render404Ajax(req, res);
  }
  var roottext = type.roottext ? type.roottext + '/' : '';
  var exttext = type.exttext ? type.exttext + '/' : '';
  var op = [
    {
      title: {
        [Op.like]: `%${search}%`,
      },
      catetype: catetype,
    },
  ];
  if (parentid != '%') {
    op.push({
      parentid: {
        [Op.like]: `${parentid}`,
      },
    });
  }
  if (adsid != '%') {
    op.push({
      adsid: {
        [Op.like]: `${adsid}`,
      },
    });
  }
  if (catestatus != '%') {
    op.push({
      catestatus: {
        [Op.like]: `${catestatus}`,
      },
    });
  }
  where = {
    [Op.and]: op,
  };
  var start = Number(req.query.start);
  var length = Number(req.query.length);
  if (req.query.order[0].column == 1) column = 'title';
  if (req.query.order[0].column == 2) column = 'slug';
  if (req.query.order[0].column == 3) column = 'author';
  if (req.query.order[0].column == 4) column = 'adsid';
  if (req.query.order[0].column == 5) column = 'postcount';
  if (req.query.order[0].column == 11) column = 'updatedAt';
  var type = req.query.order[0].dir;
  var roleAction = req.roleAction ? req.roleAction : {};
  if (Number.isInteger(start) && Number.isInteger(length)) {
    const cates = await Category.findAndCountAll({
      where: where,
      attributes: {
        include: [
          [
            sequelize.literal(
              `(SELECT COUNT(a.postid) FROM ${tbCatePostName} a WHERE a.cateid=${tbCategoryName}.id)`
            ),
            'pcount',
          ],
          [sequelize.literal(`${roleAction.actview ? roleAction.actview : 0}`), 'roleview'],
          [sequelize.literal(`${roleAction.actadd ? roleAction.actadd : 0}`), 'roleadd'],
          [sequelize.literal(`${roleAction.actedit ? roleAction.actedit : 0}`), 'roleedit'],
          [sequelize.literal(`${roleAction.actdel ? roleAction.actdel : 0}`), 'roledel'],
          [sequelize.literal(`${req.session.userid}`), 'mine'],
          [sequelize.fn('concat', roottext, sequelize.col('fullslug'), exttext), 'permalink'],
        ],
      },
      include: [
        {
          model: Ads,
          as: 'Ads',
          attributes: ['name'],
        },
        {
          model: User,
          as: 'Author',
          attributes: ['id', 'username'],
        },
      ],
      order: [[column, type]],
      offset: start,
      limit: length,
    });
    var total = cates.count;
    res.json({ aaData: cates.rows, iTotalDisplayRecords: total, iTotalRecords: total });
  } else {
    res.json({ code: 0, message: 'Error page' });
  }
};

// Ajax select2 seach
exports.select2Ajax = async (req, res) => {
  try {
    var catetype = req.params.catetype || '',
      searchText = req.query.term || req.query.q || '%',
      results = [];
    results = await Category.findAll({
      where: {
        title: {
          [Op.like]: `%${searchText}%`,
        },
        catetype: catetype,
        catestatus: 'published',
      },
      attributes: ['id', 'title'],
      order: [['title', 'ASC']],
      limit: 10,
    });
    results = results == null ? [] : results;
    res.json(results);
  } catch (err) {
    return res.json([]);
  }
};

// Lấy category by lang and slug
exports.getCategoryByLangAndSlug = async (slug, curLang) => {
  var curLangId = curLang.id;
  var cate = {};
  if (curLang.ismain == true) {
    cate = await Category.findOne({
      include: [
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
        catestatus: 'published',
      },
      //logging: console.log
    });
  } else {
    cate = await Category.findOne({
      include: [
        {
          model: CateLang,
          as: 'CateLang',
          where: {
            langid: curLangId,
          },
          required: false,
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
        catestatus: 'published',
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$CateLang.langid$': curLangId,
          },
        },
      },
      subQuery: false,
      //logging: console.log
    });
  }
  return cate;
};
// Lấy category by lang, slug and catetype
exports.getCategoryByLangSlugCatetype = async (slug, curLang, cateType) => {
  var curLangId = curLang.id;
  var cate = {};
  if (curLang.ismain == true) {
    cate = await Category.findOne({
      where: {
        slug: slug,
        catetype: cateType,
        catestatus: 'published',
      },
      include: [
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
    });
  } else {
    cate = await Category.findOne({
      include: [
        {
          model: CateLang,
          as: 'CateLang',
          where: {
            langid: curLangId,
          },
          required: false,
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
        catetype: cateType,
        catestatus: 'published',
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$CateLang.langid$': curLangId,
          },
        },
      },
      subQuery: false,
      //logging: console.log
    });
  }
  return cate;
};
// Dùng để lấy category GAME + APP cho Sidebar
// Lấy category by lang and parentid parentId = [cateid, cateid]
exports.getCategoryByLangParentSlug = async (parentId, curLang) => {
  var curLangId = curLang.id;
  var cate = {};
  if (curLang.ismain == true) {
    cate = await Category.findAll({
      include: {
        model: Category,
        as: 'Parent',
        where: {
          slug: parentId,
        },
        attributes: ['slug'],
        required: true,
      },
      where: {
        //parentid: parentId,
        catestatus: 'published',
      },
      attributes: ['slug', 'fullslug', 'title', 'seotitle', 'parentid', 'icon'],
    });
  } else {
    cate = await Category.findAll({
      include: [
        {
          model: CateLang,
          as: 'CateLang',
          where: {
            langid: curLangId,
          },
          attributes: ['title', 'seotitle'],
          required: false,
        },
        {
          model: Category,
          as: 'Parent',
          where: {
            slug: parentId,
          },
          attributes: ['slug'],
          required: true,
        },
      ],
      where: {
        //parentid: parentId,
        catestatus: 'published',
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$CateLang.langid$': curLangId,
          },
        },
      },
      attributes: ['slug', 'fullslug', 'title', 'seotitle', 'parentid', 'icon'],
      subQuery: false,
      //logging: console.log
    });
  }
  return cate;
};
// Dùng để lấy category cho Sidebar các catetype khác app
// Lấy category by lang and catetype = [cateid, cateid]
exports.getCategoryByLangCatetype = async (cateType, curLang) => {
  var curLangId = curLang.id;
  var cate = {};
  if (curLang.ismain == true) {
    cate = await Category.findAll({
      where: {
        catetype: cateType,
        catestatus: 'published',
      },
      attributes: ['id', 'slug', 'fullslug', 'title', 'parentid', 'catetype'],
    });
  } else {
    cate = await Category.findAll({
      include: [
        {
          model: CateLang,
          as: 'CateLang',
          where: {
            langid: curLangId,
          },
          attributes: ['title'],
          required: false,
        },
      ],
      where: {
        catetype: cateType,
        catestatus: 'published',
        [Op.or]: {
          islikemain: true,
          [Op.and]: {
            islikemain: false,
            '$CateLang.langid$': curLangId,
          },
        },
      },
      attributes: ['id', 'slug', 'fullslug', 'title', 'parentid', 'catetype'],
      subQuery: false,
      //logging: console.log
    });
  }
  return cate;
};
