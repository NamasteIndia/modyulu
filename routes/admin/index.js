const express = require('express');
const { getTodoList } = require('../../controllers/crontodo.controller');
const {
  getAppErrorUpdateVersionList,
  getAppSuccessUpdateVersionList,
} = require('../../controllers/logupdateversion.controller');
const { checkRole } = require('../../middleware/checkRole');
const errorController = require('../../controllers/error.controller');
var router = express.Router();
// Hien thi trang Dashboard
router.get('/', async (req, res) => {
  try {
    var todoList = await getTodoList();
    var errAutoUpdate = await getAppErrorUpdateVersionList();
    var successAutoUpdate = await getAppSuccessUpdateVersionList();
    return res.render('admin', { todoList, errAutoUpdate, successAutoUpdate });
  } catch (err) {
    return errorController.render500(req, res);
  }
});
// Cac trang khac cua admin chiu anh huong cua phan quyen
router.use('/post', checkRole('post'), require('./post.routes.js'));
router.use('/category', checkRole('category'), require('./category.routes.js'));
router.use('/redirect', checkRole('redirect'), require('./redirect.routes.js'));
router.use('/media', checkRole('media'), require('./media.routes.js'));
router.use('/comment', checkRole('comment'), require('./comment.routes.js'));
router.use('/feedback', checkRole('feedback'), require('./feedback.routes.js'));
router.use('/banner', checkRole('banner'), require('./banner.routes.js'));
router.use('/ads', checkRole('ads'), require('./ads.routes.js'));
router.use('/language', checkRole('language'), require('./language.routes.js'));
router.use('/type', checkRole('type'), require('./type.routes.js'));
router.use('/sitefeature', checkRole('sitefeature'), require('./sitefeature.routes.js'));
router.use('/menu', checkRole('menu'), require('./menu.routes.js'));
router.use('/option', checkRole('option'), require('./option.routes.js'));
router.use('/user', checkRole('user'), require('./user.routes.js'));
router.use('/role', checkRole('role'), require('./role.routes.js'));
router.use('/rolefeature', checkRole('rolefeature'), require('./rolefeature.routes.js'));
router.use('/logapkfile', checkRole('logapkfile'), require('./logapkfile.routes.js'));
router.use('/logautoupdate', checkRole('logautoupdate'), require('./logautoupdate.routes.js'));
router.use('/userui', require('./userui.routes.js'));
router.use('/apkchoice', checkRole('apkchoice'), require('./apkchoice.routes'));

module.exports = router;
