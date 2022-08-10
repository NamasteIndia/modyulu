const config = require('config');
const tableCf = config.get('database.table.prefix');
const cheerio = require('cheerio');
const db = require('../models');
const Op = db.Sequelize.Op;
const sequelize = db.Sequelize;
const Sequelize = db.sequelize;
const Post = db.post;
const tbPostName = tableCf.concat('posts');
const tbPostLangName = tableCf.concat('postlangs');
const Category = db.category;
const tbCategoryName = tableCf.concat('categories');
const tbCateLangName = tableCf.concat('catelangs');
const tbLangName = tableCf.concat('languages');
const Type = db.type;
const maxRecordInPage = 1000;
const errorController = require('./error.controller');

async function getMain(req, res) {
  try {
    var types = await Type.findAll({
      where: {
        isblock: false,
        hassitemap: true,
      },
      attributes: ['id', 'type'],
      order: [
        ['type', 'DESC'],
        ['id', 'ASC'],
      ],
    });
    var rsArr = [],
      siteArr = [],
      page = 1,
      count = 0,
      lastUpdate = new Date();
    rsArr.push(`<?xml-stylesheet type="text/xsl" href="${domain}/main-sitemap.xsl"?>`);
    rsArr.push(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`);
    await Promise.all(
      types.map(async (type) => {
        if (type.type == 'post') {
          count = await Post.count({
            where: {
              posttype: type.id,
              poststatus: 'published',
              publishedat: {
                [Op.lte]: sequelize.fn('NOW'),
              },
            },
          });
        }
        if (type.type == 'category') {
          count = await Category.count({
            where: {
              catetype: type.id,
              catestatus: 'published',
            },
          });
        }
        if (count > 0) {
          page = Math.ceil(count / maxRecordInPage);
          if (page == 1) {
            if (type.type == 'post') {
              lastUpdate = await countPostPublishedatByPosition(count, type.id);
            } else {
              lastUpdate = await countCatePublishedatByPosition(count, type.id);
            }
            siteArr.push(`<sitemap>
                                <loc>${domain}/${type.id}-sitemap.xml</loc>
                                <lastmod>${functions.formart_datetime(lastUpdate, 'seo')}</lastmod>
                            </sitemap>`);
          } else {
            var arrLoop = [];
            for (let i = 1; i <= page; i++) {
              arrLoop.push(i);
            }
            await Promise.all(
              arrLoop.map(async (p) => {
                let position = p * maxRecordInPage;
                position = position > count ? count : position;
                if (type.type == 'post') {
                  lastUpdate = await countPostPublishedatByPosition(position, type.id);
                } else {
                  lastUpdate = await countCatePublishedatByPosition(position, type.id);
                }
                siteArr.push(`<sitemap>
                                        <loc>${domain}/${type.id}-sitemap${p}.xml</loc>
                                        <lastmod>${functions.formart_datetime(
                                          lastUpdate,
                                          'seo'
                                        )}</lastmod>
                                    </sitemap>`);
              })
            );
          }
        }
      })
    );
    // Sort lai ket qua giong nhu select
    var result = [];
    types.forEach(function (key) {
      siteArr = siteArr.filter(function (site) {
        if (site.includes(key.id)) {
          result.push(site);
          return false;
        } else {
          return true;
        }
      });
    });
    rsArr.push(result.join(''));
    rsArr.push(`</sitemapindex>`);
    res.set('Content-Type', 'text/xml');
    res.send(rsArr.join(''));
  } catch (err) {
    return errorController.render500(req, res);
    //return res.status(500).send("Error");
  }
}

async function getDetail(req, res) {
  try {
    var typeId = req.params.type || '',
      page = req.params.page || 1,
      start = 1,
      end = maxRecordInPage,
      links = [],
      rsArr = [];
    var type = await Type.findOne({
      where: {
        id: typeId,
        hassitemap: true,
      },
      attributes: ['id', 'type', 'roottext', 'exttext'],
    });
    if (type == null) {
      return errorController.render404(req, res);
    }
    start = page * maxRecordInPage - maxRecordInPage + 1;
    end = start + maxRecordInPage - 1;
    if (type.type == 'post') {
      links = await getPostPublishedatByPosition(start, end, type.id);
    }
    if (type.type == 'category') {
      links = await getCatePublishedatByPosition(start, end, type.id);
    }
    rsArr.push(`<?xml-stylesheet type="text/xsl" href="${domain}/main-sitemap.xsl"?>
                    <urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                            xmlns:xhtml="http://www.w3.org/1999/xhtml"
                            xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                            xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                                                http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
                                                http://www.google.com/schemas/sitemap-image/1.1
                                                http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd
                                                http://www.w3.org/1999/xhtml
                                                http://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd">`);
    var lpost = [],
      lalternate = [],
      currentPosition = 0;
    links.forEach(function (link, i) {
      let urlExt = type.exttext || '/';
      let urlRootText = type.roottext == null || type.roottext == '' ? '' : `${type.roottext}/`;
      let urlHome = link.ismain ? domain : `${domain}/${link.langid}`;
      let url = `${urlHome}/${urlRootText}${link.slug}${urlExt}`;
      url = link.slug === 'home' ? urlHome : url;
      let publishedDate = functions.formart_datetime(link.publishedat, 'seo');
      limage = getImagesFromContent(link.content || '');
      if (currentPosition == 0 || currentPosition == link.position) {
        // permalink ngon ngu khac cung post hoặc permalink post đầu tiên
        lalternate.push(`<xhtml:link rel="alternate" hreflang="${link.langid}" href="${url}"/>`);
        lpost.push({
          url: `<url><loc>${url}</loc><lastmod>${publishedDate}</lastmod>`,
          images: limage,
        });
      } else {
        // permalink post tiep theo
        lpost.forEach(function (post) {
          rsArr.push(post.url);
          rsArr.push(post.images.join(''));
          rsArr.push(lalternate.join(''));
          rsArr.push(`</url>`);
        });
        lalternate = [];
        lpost = [];

        lalternate = [];
        lalternate.push(`<xhtml:link rel="alternate" hreflang="${link.langid}" href="${url}"/>`);
        lpost.push({
          url: `<url><loc>${url}</loc><lastmod>${publishedDate}</lastmod>`,
          images: limage,
        });
      }
      currentPosition = link.position;
    });
    // Permalink cuối
    if (lalternate.length > 0) {
      lpost.forEach(function (post) {
        rsArr.push(post.url);
        rsArr.push(post.images.join(''));
        rsArr.push(lalternate.join(''));
        rsArr.push(`</url>`);
      });
    }
    rsArr.push(`</urlset>`);
    res.set('Content-Type', 'text/xml');
    //console.log(rsArr.join(""))
    return res.send(rsArr.join(''));
  } catch (err) {
    return errorController.render500(req, res);
  }
}

async function getDetail_bk(req, res) {
  try {
    var typeId = req.params.type || '',
      page = req.params.page || 1,
      start = 1,
      end = maxRecordInPage,
      links = [],
      rsArr = [];
    var type = await Type.findOne({
      where: {
        id: typeId,
        hassitemap: true,
      },
      attributes: ['id', 'type', 'roottext', 'exttext'],
    });
    if (type == null) {
      return errorController.render404(req, res);
      //return res.status(400).send("Not Found");
    }
    start = page * maxRecordInPage - maxRecordInPage + 1;
    end = start + maxRecordInPage - 1;
    if (type.type == 'post') {
      extensionLink = '.html';
      links = await getPostPublishedatByPosition(start, end, type.id);
    }
    if (type.type == 'category') {
      links = await getCatePublishedatByPosition(start, end, type.id);
    }
    var lpost = [],
      lalternate = [],
      limage = [],
      preId = '';
    //rsArr.push(`<?xml-stylesheet type="text/xsl" href="${domain}/assets/xsl/main-sitemap.xsl"?>
    rsArr.push(`<?xml-stylesheet type="text/xsl" href="${domain}/main-sitemap.xsl"?>
                    <urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                            xmlns:xhtml="http://www.w3.org/1999/xhtml"
                            xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                            xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                                                http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
                                                http://www.google.com/schemas/sitemap-image/1.1
                                                http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd
                                                http://www.w3.org/1999/xhtml
                                                http://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd">`);
    var flagImgRunging = true;
    /* var tmp = links.map(l => {
            let a = l;
            delete a.content;
            return a;
        })
        console.log(tmp) */
    links.forEach(function (link, i) {
      let urlExt = type.exttext || '/';
      let urlRootText = type.roottext == null || type.roottext == '' ? '' : `${type.roottext}/`;
      let urlHome = link.ismain ? domain : `${domain}/${link.langid}`;
      let url = `${urlHome}/${urlRootText}${link.slug}${urlExt}`;
      url = link.slug === 'home' ? urlHome : url;
      let publishedDate = functions.formart_datetime(link.publishedat, 'seo');
      if ((preId === '' || preId === link.slug) && i < links.length - 1) {
        // thuc hien luu phan tu vao mang tam, sau khi add du ngon ngu cho LINK moi thuc hien add vao sitemap
        lalternate.push(`<xhtml:link rel="alternate" hreflang="${link.langid}" href="${url}"/>`);
        lpost.push(`<url><loc>${url}</loc><lastmod>${publishedDate}</lastmod>`);
        if (flagImgRunging) {
          var content = link.content || '';
          if (content !== '') {
            var $ = cheerio.load(content, null, false);
            $('.sm-single-content-image').each(function (i, el) {
              let src = $(el).find('>img').attr('src') || '',
                title = $(el).find('>img').attr('title') || '',
                caption = $(el).find('>.caption').text() || '';
              image = [];
              title = functions.decode_specials_char(title);
              title = title.replace(/\W/g, ' ');
              title = title.replace(/\s+/g, ' ');
              if (src !== '') {
                image.push(`<image:image><image:loc>${src}</image:loc>`);
                title !== '' && image.push(`<image:title>${title}</image:title>`);
                caption !== '' && image.push(`<image:caption>${caption}</image:caption>`);
                image.length > 0 && image.push('</image:image>'), limage.push(image.join(''));
              }
            });
          }
          flagImgRunging = false;
        }
      } else {
        // phan tu cuoi cung cua LINK cuoi cung
        if (i == links.length - 1) {
          lalternate.push(`<xhtml:link rel="alternate" hreflang="${link.langid}" href="${url}"/>`);
          lpost.push(`<url><loc>${url}</loc><lastmod>${publishedDate}</lastmod>`);
        }
        // add LINK vao sitemap va reset cac object cho LINK tiep theo
        lpost.forEach(function (url) {
          rsArr.push(url);
          rsArr.push(limage.join(''));
          rsArr.push(lalternate.join(''));
          rsArr.push(`</url>`);
        });
        lalternate = [];
        lpost = [];
        limage = [];
        // phan tu dau tien cua LINK tiep theo
        if (preId !== link.slug) {
          flagImgRunging = true;
          lalternate.push(`<xhtml:link rel="alternate" hreflang="${link.langid}" href="${url}"/>`);
          lpost.push(`<url><loc>${url}</loc><lastmod>${publishedDate}</lastmod>`);
        }
      }
      preId = link.slug;
    });
    rsArr.push(`</urlset>`);
    res.set('Content-Type', 'text/xml');
    return res.send(rsArr.join(''));
  } catch (err) {
    return errorController.render500(req, res);
  }
}

async function countPostPublishedatByPosition(position, posttype) {
  try {
    var query = `SELECT publishedat FROM (
                        SELECT t.modifiedat publishedat, @rownum := @rownum + 1 AS position
                        FROM ${tbPostName} t JOIN (SELECT @rownum := 0) r 
                        WHERE ('${posttype}' = 'post-apk' AND slug = 'home') OR (t.posttype = '${posttype}' 
                        AND t.poststatus = 'published' 
                        AND t.publishedat <= NOW()
                        AND t.allowindex = true
                        AND t.nolink = false)
                    ) a WHERE a.position = ${position}`;
    const post = await Sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
    if (post.length > 0) {
      return new Date(post[0].publishedat);
    }
    return new Date();
  } catch (err) {
    return new Date();
  }
}

async function countCatePublishedatByPosition(position, catetype) {
  try {
    var query = `SELECT publishedat FROM (
                        SELECT t.publishedat, @rownum := @rownum + 1 AS position
                        FROM ${tbCategoryName} t JOIN (SELECT @rownum := 0) r
                        WHERE t.catetype = '${catetype}' 
                        AND t.catestatus = 'published'
                        AND t.allowindex = true
                        ) a WHERE a.position = ${position}`;
    const category = await Sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
    if (category.length > 0) {
      return new Date(category[0].publishedat);
    }
    return new Date();
  } catch (err) {
    return new Date();
  }
}

async function getPostPublishedatByPosition(startPosition, endPosition, postType) {
  try {
    var query = `SELECT abc.* 
                        FROM ( 
                            SELECT a.position, a.slug, a.publishedat, a.content, b.id langid, b.ismain,
                            CASE WHEN (a.notenglish=true AND b.ismain=true) THEN true ELSE false END notenglish1, a.notenglish
                            FROM (
                                SELECT @rownum := @rownum + 1 AS position, p.id, p.slug, p.content, p.modifiedat publishedat, p.islikemain, p.notenglish
                                FROM ${tbPostName} p JOIN (SELECT @rownum := 0) r
                                WHERE ('${postType}' = 'post-apk' AND p.slug = 'home') OR (p.posttype = '${postType}'
                                    AND p.poststatus = 'published'
                                    AND p.publishedat <= now()
                                    AND p.allowindex = true
                                    AND p.nolink = false)
                            ) a INNER JOIN ${tbLangName} b LEFT JOIN ${tbPostLangName} c ON b.id = c.langid AND c.postid = a.id
                            WHERE (a.islikemain = true) OR (a.islikemain = false AND ( b.ismain=true OR b.id = c.langid))
                            ORDER BY a.position, b.ismain DESC, b.id 
                        ) abc WHERE abc.notenglish1=false AND abc.position >= ${startPosition} AND abc.position <= ${endPosition} ORDER BY abc.position`;
    const posts = await Sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
    return posts ? posts : [];
  } catch (err) {
    return [];
  }
}

async function getCatePublishedatByPosition(startPosition, endPosition, cateType) {
  try {
    var query = `SELECT abc.*
                    FROM (
                        SELECT a.position, a.slug, a.publishedat, "" content, b.id langid, b.ismain
                        FROM (
                        SELECT @rownum := @rownum + 1 AS position, p.id, IFNULL(p.fullslug,p.slug) slug, p.title content, p.createdAt publishedat, p.islikemain
                        FROM ${tbCategoryName} p JOIN (SELECT @rownum := 0) r
                        WHERE p.catetype = '${cateType}'
                        AND p.catestatus = 'published'
                        AND p.allowindex = true
                        ) a INNER JOIN ${tbLangName} b LEFT JOIN ${tbCateLangName} c ON b.id = c.langid AND c.cateid = a.id
                        WHERE (a.islikemain = true) OR (a.islikemain = false AND ( b.ismain=true OR b.id = c.langid))
                        ORDER BY a.position, b.ismain DESC, b.id
                    ) abc WHERE abc.position >= ${startPosition} AND abc.position <= ${endPosition} ORDER BY abc.position`;
    const cates = await Sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
    return cates ? cates : [];
  } catch (err) {
    return [];
  }
}

function getImagesFromContent(content) {
  try {
    content = content ? content : '';
    var $ = cheerio.load(content, null, false),
      limage = [];
    $('.sm-single-content-image').each(function (i, el) {
      let src = $(el).find('>img').attr('src') || '',
        title = $(el).find('>img').attr('title') || '',
        caption = $(el).find('>.caption').text() || '';
      image = [];
      title = functions.decode_specials_char(title);
      title = title.replace(/\W/g, ' ');
      title = title.replace(/\s+/g, ' ');
      if (src !== '') {
        src = src.match(/^\/uploads/g) ? `${domain}${src}` : src;
        image.push(`<image:image><image:loc>${src}</image:loc>`);
        title !== '' && image.push(`<image:title>${title}</image:title>`);
        caption !== '' && image.push(`<image:caption>${caption}</image:caption>`);
        image.length > 0 && image.push('</image:image>'), limage.push(image.join(''));
      }
    });
    return limage;
  } catch (err) {
    console.log(err);
    return [];
  }
}

module.exports = {
  getMain,
  getDetail,
};
