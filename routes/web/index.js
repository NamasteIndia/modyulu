const express = require('express');
var router = express.Router();
const fs = require('fs');
const webController = require('../../controllers/web.controller');
const rssController = require('../../controllers/seo.rss.controller');
const logApkController = require('../../controllers/logapkfile.controller');
const sitemapController = require('../../controllers/seo.sitemap.controller');
// Icon site
router.get('/favicon.ico', (req, res) => res.status(204).end());
router.get('/main-sitemap.xsl', function (req, res) {
  fs.ReadStream('./main-sitemap.xsl').pipe(res);
});
// Ajax rating, vote, view count
router.use('/interactive', require('./interactive.routes.js'));
router.use('/:langid/interactive', require('./interactive.routes.js'));
// Ajax comment form
router.use('/comment', require('./comment.routes.js'));
router.use('/:langid/comment', require('./comment.routes.js'));
// Contact, Dmca
router.use('/feedback', require('./feedback.routes.js'));
router.use('/:langid/feedback', require('./feedback.routes.js'));
// Sitemap
router.get('/sitemap.xml', sitemapController.getMain);
router.get('/:type-sitemap.xml', sitemapController.getDetail);
router.get('/:type-sitemap:page.xml', sitemapController.getDetail);
// RSS
router.get(`/${sitenameSlug}.rss`, rssController.homeRss);
router.get(`/:langid/${sitenameSlug}.rss`, rssController.homeRss);
router.get(`/${sitenameSlug}-:cateslug.rss`, rssController.homeRss);
router.get(`/:langid/${sitenameSlug}-:cateslug.rss`, rssController.homeRss);
// Ajax suggest cho form search
router.post('/suggest', webController.ajaxSuggestSearch);
// Ajax section popular, new update, top trending apk & blog trang chu
router.post('/post', webController.ajaxPostHome);
// Ajax lay apk link tu google khi user view page single
router.post('/getapk', logApkController.singleApkFileLoading);
// Trang download App
/* router.get("/download", webController.execDownloadApkPage);
router.get("/:langid/download", webController.execDownloadApkPage); */
// Trang download App
// https://gamestoremobi.com/download/adobe-lightroom-cc
// router.get('/download/:slug', webController.execDownloadApkPage);
// router.get('/:langid/download/:slug', webController.execDownloadApkPage);
// https://gamestoremobi.com/download/mod/adobe-lightroom-cc-{1}
// router.get('/download/mod/:slug', webController.execDownloadApkPage2);
// router.get('/:langid/download/mod/:slug', webController.execDownloadApkPage2);
// https://gamestoremobi.com/download/original/adobe-lightroom-cc-{1}
// router.get('/download/original/:slug', webController.execDownloadApkPage2);
// router.get('/:langid/download/original/:slug', webController.execDownloadApkPage2);

/* // New Link Download
router.get("/:slug/download", webController.execDownloadApkPage);
router.get("/:langid/:slug/download", webController.execDownloadApkPage);
// https://gamestoremobi.com/download/mod/adobe-lightroom-cc-{1}
router.get("/:slug/download/mod", webController.execDownloadApkPage2);
router.get("/:langid/:slug/download/mod", webController.execDownloadApkPage2);
// https://gamestoremobi.com/download/original/adobe-lightroom-cc-{1}
router.get("/:slug/download/original", webController.execDownloadApkPage2);
router.get("/:langid/:slug/download/original", webController.execDownloadApkPage2); */

// http://domain done
router.get('/', webController.homePage);
//---------DEVERLOPER----------------------------------------------------
// http://domain/developer/activision-publishing-inc done
router.get('/developer/:slug', webController.developerPage);
// http://domain/es/developer/activision-publishing-inc done
router.get('/:langid/developer/:slug', webController.developerPage);
// http://domain/developer/activision-publishing-inc/page/2 done
router.get('/developer/:slug/page/:page', webController.developerPage);
// http://domain/es/developer/activision-publishing-inc/page/2 done
router.get('/:langid/developer/:slug/page/:page', webController.developerPage);
//---------DEVERLOPER----------------------------------------------------
// http://domain/developer/activision-publishing-inc done
router.get('/tag/:slug', webController.tagPage);
// http://domain/es/developer/activision-publishing-inc done
router.get('/:langid/tag/:slug', webController.tagPage);
// http://domain/developer/activision-publishing-inc/page/2 done
router.get('/tag/:slug/page/:page', webController.tagPage);
// http://domain/es/developer/activision-publishing-inc/page/2 done
router.get('/:langid/tag/:slug/page/:page', webController.tagPage);
//---------POST----------------------------------------------------
// http://domain/minecraft.html done
router.get('/:slug.html', webController.singlePage);
// http://domain/es/minecraft.html done
router.get('/:langid/:slug.html', webController.singlePage);
//-------------------------------------------------------------
// http://domain/es done
// http://domain/games done
// http://domain/about-us done
router.get('/:slug', webController.onlySlugPage);
//-------------------------------------------------------------
// http://domain/es/games done
// http://domain/es/about-us done
// http://domain/games/adventure done
router.get('/:langid/:slug', webController.hasSlugPage);
//-------------------------------------------------------------
// http://domain/games/page/2 done
router.get('/:slug/page/:page', webController.onlySlugPage);
// http://domain/es/games/page/2 done
router.get('/:langid/:slug/page/:page', webController.hasSlugPage);
// http://domain/es/games/adventure done
// http://domain/es/games/adventure/page/2 done
// http://domain/games/adventure/random done
// http://domain/games/adventure/rando/page/2 done
// http://domain/es/games/adventure/random done
// http://domain/es/games/adventure/random/page/2 done
// Category multiple level link
router.get('/:langid/:slug/*', webController.hasLangSlugCategory);

module.exports = router;
