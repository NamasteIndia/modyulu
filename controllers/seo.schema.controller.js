const md5 = require('md5');
const domainName = 'modyolo.app';
const siteName = 'modyolo';
const siteAlterName = 'Modyolo';
const emailSupport = `support@${domainName}`;
const listSocials = `[
    "https://www.facebook.com/modyoloapp"
]`;

async function Organization(curLang, Languages, homeContent) {
  let homeUrl = curLang.ismain ? `${domain}/` : `${domain}/${curLang.id}/`;
  let homeDescription = homeContent.seodescription
    ? homeContent.seodescription
    : homeContent.description;
  return `{
        "@context":"https://schema.org",
        "@type": "Organization",
        "@id": "${homeUrl}#organization",
        "url": "${homeUrl}",
        "name": "${siteName}",
        "alternateName": "${siteAlterName}",
        "description": "${homeDescription}",
        "logo": {
            "@type":"ImageObject",
            "url": "${domain}/assets/image/logo.png"
        },
        "contactPoint":[{
            "@type":"ContactPoint",
            "contactType": "customer care",
            "email": "${emailSupport}"
        }],
        "sameAs": ${listSocials}
    }`;
}
// 2
async function WebSite(curLang) {
  let homeUrl = curLang.ismain ? `${domain}/` : `${domain}/${curLang.id}/`;
  return `{
        "@context":"https://schema.org",
        "@type": "WebSite",
        "url": "${homeUrl}",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "${homeUrl}?s={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    }`;
}
//3
/* thumb{
    url: "url imgage",
    childsizes: "WxH,WxH"
} */
async function ImageObject(curLang, curUrl, thumb) {
  try {
    var thumbObj = thumb && thumb.childsizes ? thumb.childsizes.split(',') : [];
    var sizeArr = thumbObj.length > 0 ? thumbObj[thumbObj.length - 1].split('x') : [];
    var width = sizeArr[0] || 0;
    var height = sizeArr[1] || 0;
    var url = curUrl.replace(new RegExp(`^\/${curLang.id}`, 'g'), '');
    url = url == '' ? `${domain}/${curLang.id}/` : `${domain}${curUrl}`;
    return `{
            "@context":"https://schema.org",
            "@type":"ImageObject",
            "@id":"${url}#primaryimage",
            "inLanguage":"${curLang.codelang}",
            "url":"${thumb.url}",
            "width":${width},
            "height":${height}
        }`;
  } catch (err) {
    return `{}`;
  }
}

//4
//pageType = "home" / "page"
/* page{
    seotitle: "Page title",
    seodescription: "Page description",
    publishat: "publishat", 
    modifyat: "modifyat"
} */
async function WebPage(pageType, curLang, curUrl, page) {
  //var rootUrl = (curLang.ismain) ? `${domain}/` : `${domain}/${curLang.id}/`;
  var url = pageType == 'home' && !curLang.ismain ? `${domain}${curUrl}/` : `${domain}${curUrl}`;
  var publishat = functions.formart_datetime(page.publishat, 'seo');
  var modifyat = functions.formart_datetime(page.modifyat, 'seo');
  var rs = `{
        "@context":"https://schema.org",
        "@type":"WebPage",
        "url":"${url}",
        "name":"${page.seotitle}",      
        "description":"${page.seodescription}",
        "datePublished":"${publishat}",
        "dateModified":"${modifyat}",        
        "inLanguage":"${curLang.codelang}",
        "potentialAction":[{
            "@type":"ReadAction",
            "target":[
                "${url}"
            ]
        }]
    }`;
  return rs;
}
// 5
/* cate{
    seotitle: "Category title",
    seodescription: "Category description"
} */
async function CollectionPage(curLang, curUrl, cate) {
  var rootUrl = curLang.ismain ? `${domain}/` : `${domain}/${curLang.id}/`;
  var url = `${domain}${curUrl}`;
  return `{
        "@context":"https://schema.org",
        "@type": "CollectionPage",
        "@id": "${url}#webpage",
        "url": "${url}",
        "name": "${cate.seotitle}",
        "isPartOf": {
            "@id": "${rootUrl}#website"
        },
        "description": "${cate.seodescription}",
        "breadcrumb": {
            "@id": "${url}#breadcrumb"
        },
        "inLanguage": "${curLang.codelang}",
        "potentialAction": [{
            "@type": "ReadAction",
            "target": [
                "${url}"
            ]
        }]
    }`;
}
// 6
/* app {
    name: "App name"
    publishat: "publishat",
    modifyat: "modifyat",
    author: "EncodeUserId",
    os: "Oparation System",
    version:"App version",
    price: "Price",
    ccy: "Ccy",
    rate:{      
        total: 0,
        average: 0
    }
    comment:0
} */
async function MobileApplication(curLang, curUrl, app) {
  var rootUrl = curLang.ismain ? `${domain}/` : `${domain}/${curLang.id}/`;
  var url = `${domain}${curUrl}`;
  var installUrl = `${rootUrl}download/${app.slug}`;
  var price = parseInt(app.price) || 0;
  var ratingText = '';
  var reviewsText = '';
  var publishat = functions.formart_datetime(app.publishat, 'seo');
  var modifyat = functions.formart_datetime(app.modifyat, 'seo');
  /* var ratingLines = (app.ratingLines) ? app.ratingLines : {};
    var reviews = (app.reviews) ? app.reviews : [];
    var reviewsTextArr = [];    
    reviews.forEach(r => {
        var author = (r.author) ? r.author : {};
        var authorName = (author.nickname && author.nickname!="") ? author.nickname : author.username;
        var reviewDate = functions.formart_datetime(r.createdAt, "seo");
        var reviewContent = fortmat_text(r.content);
        reviewsTextArr.push(`{
            "@type": "Review",
            "author": {
                "@type": "Person",
                "name": "${authorName}"
            },
            "datePublished": "${reviewDate}",
            "reviewBody": "${reviewContent}",
            "reviewRating": {
                "@type": "Rating",
                "bestRating": 5,
                "ratingValue": ${r.rating}
            }
        }`);
    });
    reviewsText = (reviewsTextArr.length > 0) ? `,"review": [${reviewsTextArr.join(",")}]` : ""; */
  /* if(ratingLines.point > 0){
        ratingText = `,"aggregateRating": {
            "@type": "AggregateRating",
            "bestRating": 5,
            "worstRating": 1,
            "ratingCount": ${ratingLines.numReview},
            "ratingValue": ${ratingLines.point}
        }`;
    } */
  var screenshoots = app.screenshoots ? app.screenshoots : [];
  screenshoots = screenshoots.map((ss) => `"${ss.url}"`);
  var screenshootText = '';
  if (screenshoots.length > 0) {
    screenshootText = `"screenshot":{
            "@type":"ImageObject",
            "url":[${screenshoots.join(',')}]
        },`;
  }
  var categoriesText = '';
  categoriesText +=
    app.category && app.category.length > 0 ? `"applicationCategory": "${app.category}"` : '';
  categoriesText +=
    app.subcategory && app.subcategory.length > 0 && categoriesText.length > 0
      ? `,"applicationSubCategory": "${app.subcategory}",`
      : '';
  return `{
        "@context":"https://schema.org",
        "@type": "SoftwareApplication",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${url}#article"
        },
        "name": "${app.title}",
        "url": "${url}",
        "headline": "${app.seotitle}",
        "description": "${app.seodescription}",
        "softwareVersion": "${app.version}",${app.imgSquare ? `"thumbnailUrl": "${app.imgSquare}",` : ''
    }${app.imgRectangle ? `"image": "${app.imgRectangle}",` : ''}${categoriesText}
        "fileSize": "${app.fileSize}",
        "operatingSystem": "Android",
        "softwareRequirements": "${app.os}",
        "datePublished": "${publishat}",
        "dateModified": "${modifyat}",
        "installUrl": "${installUrl}",
        "publisher": {
            "@type": "Thing",
            "name": "${app.developerName}"
        }, ${screenshootText}
        "offers": {
            "@type": "Offer",
            "price": "${price}",
            "priceCurrency": "${app.ccy}"
        },
        "inLanguage": "${curLang.codelang}"${reviewsText}${ratingText}
    }`;
}
//"operatingSystem": "${app.os}",
// 7
/* User{
    id: "encodeUserId",
    name: "LastnameFirstname",
    description: "Description"
    avatar: url
} */
async function Person(curLang, User) {
  var rootUrl = curLang.ismain ? `${domain}/` : `${domain}/${curLang.id}/`;
  var userID = `${User.id}` || '0';
  var userIDEncode = md5(userID);
  var avatar = User.avatar ? User.avatar : `${domain}/assets/image/avatar.jpg`;
  return `{
        "@context":"https://schema.org",
        "@type": "Person",
        "@id": "${rootUrl}#/schema/person/${userIDEncode}",
        "name": "${User.name}",
        "image": {
            "@type": "ImageObject",
            "@id": "${rootUrl}#personlogo",
            "inLanguage": "${curLang.codelang}",
            "url": "${avatar}",
            "caption": "${User.name}"
        },
        "description": "${User.description}",
        "sameAs":[
            "${rootUrl}"
        ]
    }`;
}
// 8
/* post{
    title: "seotitle",
    publishat: "publishat",
    modifyat: "modifyat",
    author: "EncodeUserId",
    category: "Category name",
    comment: 0
} */
async function Article(curLang, curUrl, post) {
  var homeUrl = curLang.ismain ? `${domain}/` : `${domain}/${curLang.id}/`;
  var url = `${domain}${curUrl}`;
  var userID = `${post.author}` || '0';
  var userIDEncode = md5(userID);
  var publishat = functions.formart_datetime(post.publishat, 'seo');
  var modifyat = functions.formart_datetime(post.modifyat, 'seo');

  var reviews = post.reviews ? post.reviews : [];
  var reviewsTextArr = [];
  reviews.forEach((r) => {
    var author = r.author ? r.author : {};
    var authorName = author.nickname && author.nickname != '' ? author.nickname : author.username;
    var reviewDate = functions.formart_datetime(r.createdAt, 'seo');
    var reviewContent = fortmat_text(r.content);
    reviewsTextArr.push(`{
            "@type": "Comment",
            "author": {
                "@type": "Person",
                "name": "${authorName}"
            },
            "dateCreated": "${reviewDate}",
            "description": "${reviewContent}"
        }`);
  });
  reviewsText = reviewsTextArr.length > 0 ? `,"comment": [${reviewsTextArr.join(',')}]` : '';

  var screenshoots = post.screenshoots ? post.screenshoots : [];
  screenshoots = screenshoots.map((ss) => `"${ss.url}"`);
  var screenshootText = '';
  if (screenshoots.length > 0) {
    screenshootText = `"image":[${screenshoots.join(',')}],`;
  }

  return `{
        "@context":"https://schema.org",
        "@type": "BlogPosting",
        "@id": "${url}",
        "author": {
            "@id": "${homeUrl}#/schema/person/${userIDEncode}"
        },
        "headline": "${post.seotitle}",
        "datePublished": "${publishat}",
        "dateModified": "${modifyat}",
        "publisher": {
            "@id": "${homeUrl}#organization"
        },${post.thumb && post.thumb.url ? `"image": "${post.thumb.url}",` : ''}
        "articleSection": "${post.category}"${reviewsText},${screenshootText}
        "inLanguage": "${curLang.codelang}"
    }`;
}

// 9
async function FAQs(faqs) {
  var rs = [];
  faqs.forEach((faq) => {
    var content = fortmat_text(faq.content) || '';
    rs.push({
      '@type': 'Question',
      name: faq.title,
      acceptedAnswer: {
        '@type': 'Answer',
        text: content,
      },
    });
  });
  if (rs.length > 0) {
    return `{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": ${JSON.stringify(rs)}
        }`;
  }
  return '';
}

function fortmat_text(html) {
  //html = xssFilters.inHTMLData(html);
  html = html.replace(/<\/*\w+>/g, '');
  html = html.replace(/\r\n|\n|\r/g, ' ');
  html = html.replace(/\"/g, '&quot;');
  html = html.replace(/\'/g, '&apos;');
  return html;
}

// 10
async function createTocSchema(arr, url) {
  try {
    var rs = [];
    url += url.match(/\/$/g) ? '' : '/';
    arr.forEach(function (item, i) {
      let slug = functions.convert_slug(item);
      let id = `${url}#${slug}`;
      rs.push(
        `{"@type":"ListItem", "item":{"@type":"Thing", "url":"${id}", "@id":"${id}", "name":"${item}"}, "position": ${i + 1
        }}`
      );
    });
    if (rs.length > 0) {
      return `{"@context":"https://schema.org", "@type":"ItemList", "@id":"${url}#toc", "mainEntityOfPage":"${url}#article", "itemListElement":[${rs.join(
        ','
      )}]}`;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// 11
async function CreativeWorkSeries(data) {
  var reviews = data.reviews && data.reviews.rows ? data.reviews.rows : [];
  var reviewsTextArr = [];
  reviews.forEach((r) => {
    var author = r.author ? r.author : {};
    var authorName = author.nickname && author.nickname != '' ? author.nickname : author.username;
    var reviewDate = functions.formart_datetime(r.createdAt, 'seo');
    var reviewContent = fortmat_text(r.content);
    reviewsTextArr.push(`{
            "@type": "Review",
            "author": {
                "@type": "Person",
                "name": "${authorName}"
            },
            "datePublished": "${reviewDate}",
            "reviewBody": "${reviewContent}",
            "reviewRating": {
                "@type": "Rating",
                "bestRating": 5,
                "ratingValue": ${r.rating}
            }
        }`);
  });
  reviewsText = reviewsTextArr.length > 0 ? `,"review": [${reviewsTextArr.join(',')}]` : '';
  var ratingLines = data.ratingLines ? data.ratingLines : {};
  if (ratingLines.point > 0) {
    return `{
            "@context": "https://schema.org/",
            "@type": "CreativeWorkSeries",
            "name": "${data.title}",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "${ratingLines.point}",
                "bestRating": "5",
                "ratingCount": "${ratingLines.numReview}"
            }${reviewsText}
        }`;
  }
  return '';
}

module.exports = {
  Organization,
  WebSite,
  WebPage,
  CollectionPage,
  MobileApplication,
  Article,
  Person,
  ImageObject,
  FAQs,
  createTocSchema,
  CreativeWorkSeries,
};
