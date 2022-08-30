const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require('config');
const appCf = config.get('app');
const serverCf = config.get('server');
const domain = config.get('server.domain');
const dashboard = config.get('server.dashboard');
const functions = require('./libs/functions');
const cors = require('cors');
const compress = require('compression');
const app = express();
var i18n = require('i18n');
const device = require('express-device');
const db = require('./models');
const Op = db.Sequelize.Op;
const corsOptions = {
  origin: '*',
};
const crontodoController = require('./controllers/crontodo.controller');
app.use(device.capture());
app.use(compress());
app.use(cors(corsOptions));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
// SEO file
app.use('/', express.static(__dirname + '/static', { etag: false }));
// Duong dan static files /assets cho Admin
app.use(`/${dashboard}/assets`, express.static(__dirname + '/public/admin'));
// Duong dan static files /assets cho Fontend
app.use('/assets', express.static(__dirname + '/public/web/assets'));
// Thu muc update images
app.use('/uploads', express.static(__dirname + '/uploads'));
// Parse requests of content-type - application/json
app.use(bodyParser.json({ limit: '50mb' }));
// Parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser('_secret_'));
app.use(
  session({
    secret: serverCf.secret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
  })
);
const imglazy = '/assets/image/lazy.jpg';
const siteName = appCf.siteName || 'Teachgara.com';
const siteSlug = appCf.siteSlug || 'Teachgara';
const modText = appCf.modText || ' Mod';
const apkText = appCf.apkText || ' Apk';
// Bien toan cuc dung tren cac routes
global.domain = domain;
global.dashboard = dashboard;
global.functions = functions;
global.sitename = siteName;
global.sitenameSlug = siteSlug;
global.imglazy = imglazy;
global.modText = modText;
global.apkText = apkText;
// Bien toan cuc dung tren file ejs
app.locals.domain = domain;
app.locals.dashboard = dashboard;
app.locals.functions = functions;
app.locals.sitename = siteName;
app.locals.sitenameSlug = siteSlug;
app.locals.imglazy = imglazy;
app.locals.modText = modText;
app.locals.apkText = apkText;

/* app.all('*', (req, res, next) => {
    var ip = req.headers.host || "";
  //console.log(req.headers.host);
    // Nếu là IP thì chuyển đi, ko thì ko làm gì cả
    // Thay IP sv vào
    if(ip=="45.33.111.52:8080"){ //45.33.111.52
        return res.redirect('https://techbigs.com' + req.url);
    }
  next();
}); */

// Auto create table with its data into the database
db.sequelize.sync({ force: false, alter: true });

// Cấu hình ngôn ngữ
app.use(i18n.init);
const Language = db.language;
Language.findAll({
  where: {
    isblock: false,
  },
  attributes: ['id'],
  raw: true,
}).then((langs) => {
  var langids = langs.map((lang) => lang.id);
  i18n.configure({
    locales: langids,
    directory: __dirname + '/locales',
    cookie: 'lang',
  });
});
// Khai báo ngôn ngữ cho site
//const Language = db.language;
const Redirect = db.redirect;
const Ads = db.ads;
app.use(async function (req, res, next) {
  var url = req.url,
    slug = url.replace(/^\/|\.html$|\/$/g, ''),
    arrSlug = slug.split('/'),
    curLangId = arrSlug[0],
    mainLang = {},
    curLang = {};
  // Check URL ko có / sau cùng
  var fullUrl = 'https://' + req.get('host') + req.originalUrl;
  // var fullUrl = 'http://' + req.get('host') + req.originalUrl;
  if (req.method == 'GET' && !functions.checkUrlValid(fullUrl)) {
    res.set('location', fullUrl + '/');
    return res.status(301).send();
  }
  const langs = await Language.findAll({
    where: {
      isblock: false,
    },
    attributes: ['id', 'name', 'codelang', 'area', 'ismain'],
    raw: true,
  });
  langs.forEach((l) => {
    if (l.ismain) {
      mainLang = l;
    }
    if (l.id == curLangId) {
      curLang = l;
    }
  });
  curLang = curLang.id === undefined ? mainLang : curLang;
  if (curLang.ismain) {
    slug = url.replace(/^\/|\.html/g, '');
  } else {
    slug = url.replace(new RegExp(`^\/${curLang.id}|\.html$`, 'g'), '');
    slug = slug.replace(/^\//g, '');
  }
  slug = slug.replace(/\/$/g, '');
  if (slug.length > 0) {
    var fullUrl = `${domain}${req.url}`;
    const red = await Redirect.findOne({
      where: {
        isblock: false,
        [Op.or]: [{ oldslug: slug }, { oldslug: fullUrl }],
      },
      attributes: ['newslug', 'type', 'objtype'],
    });
    if (red !== null) {
      if (red.objtype == 'othersite') {
        url = red.newslug;
      } else {
        url = curLang.ismain
          ? `${domain}/${red.newslug}`
          : `${domain}/${curLang.id}/${red.newslug}`;
        url = red.objtype == 'post' ? url.concat('/') : url;
      }
      res.set('location', url);
      return res.status(red.type).send();
    }
  }
  //   res.cookie('lang', curLang.id, { maxAge: 900000 });
  req.languages = langs;
  req.curLang = curLang;
  req.mainLang = mainLang;
  res.setLocale(curLang.id);
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    agent = req.get('User-Agent');
  ip = ip == '::1' ? '127.0.0.1' : ip;
  ip = ip.split(':').pop();
  req.ipAddr = ip;
  req.userAgent = agent;
  res.locals.cookies = req.cookies;
  res.locals.session = req.session;
  var adsheader = await Ads.findOne({
    where: {
      isheader: true,
      isblock: false,
      offads: false,
    },
    attributes: ['adscode', 'islazy'],
  });
  res.locals.adsheader = adsheader;
  if (req.method.toLocaleLowerCase() == 'get') {
    req.session.ajaxpagetoken = functions.shuffle();
  }
  const optionOffShare = await Option.findOne({
    where: {
      metakey: 'off_button_share',
    },
  });
  var offBtnShare = optionOffShare && optionOffShare.metavalue == 'true' ? true : false;
  res.locals.offBtnShare = offBtnShare;
  next();
});

// Admin URL
const { execPostPage } = require('./controllers/web.controller');
const { authCookie, authRedirect, authAdminPage, authHeader } = require('./middleware/authJwt');
app.use(`/${dashboard}`, authHeader, authCookie, authAdminPage, require('./routes/admin'));
app.get('/login', authCookie, authRedirect, execPostPage);
app.get('/:langid/login', authCookie, authRedirect, execPostPage);
app.get('/register', authCookie, authRedirect, execPostPage);
app.get('/:langid/register', authCookie, authRedirect, execPostPage);
app.use('/account', authCookie, require('./routes/web/account.routes'));
app.use('/:langid/account', authCookie, require('./routes/web/account.routes'));
app.use('/auth', require('./routes/admin/auth.routes.js'));
app.use('/:langid/auth', require('./routes/admin/auth.routes.js'));
const AuthToken = db.auth;
app.get('/logout', (req, res) => {
  //var token = req.session.token || "";
  var username = req.session.username || '';
  req.session.destroy(() => {
    AuthToken.update(
      {
        isblock: true,
      },
      {
        where: {
          username: username,
        },
      }
    );
    res.cookie('token', '', { maxAge: 0, httpOnly: true });
    res.redirect(`/login`);
  });
});

// Fontend URL
app.use('/', authCookie, require('./routes/web/index.js'));

const errorController = require('./controllers/error.controller');
// 404 error handler
app.use(function (error, req, res, next) {
  console.log(error);
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Show page Error handler
app.use(function (err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  console.log(err);
  return errorController.render404(req, res);
});

// Cron Auto update version
const cron = require('node-cron');
Option = db.option;
cron.schedule('*/2 * * * *', async function () {
  const optionSite = await Option.findOne({
    where: {
      metakey: 'off_cron_auto_update',
    },
  });
  if (optionSite && optionSite.metavalue == 'false') {
    await crontodoController.execTodoList();
  }
});

// Run Server
const PORT = serverCf.port || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
