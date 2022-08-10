/* page {
    pagetype
    seotitle,
    seodescription,
    index,
    follow
} */
async function baseMeta(curLang, curUrl, page, arrPageLangs) {
    var arrMetaTags = [];
    var urlNoneLang = (!curLang.ismain) ? curUrl.replace(new RegExp(`^\/${curLang.id}`, 'g'), "") : curUrl;
    urlNoneLang = (urlNoneLang == "") ? "/" : urlNoneLang;
    var canonicalUrl = (curLang.ismain) ? `${domain}${urlNoneLang}` : `${domain}/${curLang.id}${urlNoneLang}`;
    var robotFullText = "";
    robotFullText += (page.index == true) ? "index, " : "noindex, ";
    robotFullText += (page.follow == true) ? "follow" : "nofollow";
    var googlebotText = (page.index == true) ? "index" : "noindex";
    var googlebotNewsText = (page.index == true) ? "snippet" : "nosnippet";
    arrMetaTags.push(`<meta name="real-googlebot" content="${googlebotText}">`);
    arrMetaTags.push(`<meta name="real-googlebot-news" content="${googlebotNewsText}">`);
    arrMetaTags.push(`<meta name="real-robots" content="${robotFullText}">`);
    arrMetaTags.push(`<title>${page.seotitle}</title>`);
    if(page.seodescription!=null && page.seodescription!=""){
        arrMetaTags.push(`<meta name="description" content="${page.seodescription}">`);
    }
    arrMetaTags.push(`<meta property="og:type" content="${page.pagetype}">`);
    arrMetaTags.push(`<meta property="og:site_name" content="${sitename}">`);
    arrMetaTags.push(`<meta property="og:url" content="${canonicalUrl}">`);
    arrMetaTags.push(`<meta property="og:title" content="${page.seotitle}">`);
    if(page.seodescription!=null && page.seodescription!=""){
        arrMetaTags.push(`<meta property="og:description" content="${page.seodescription}">`);
    }
    arrMetaTags.push(`<meta name="twitter:card" content="summary_large_image">`);
    arrMetaTags.push(`<meta name="twitter:title" content="${page.seotitle}">`);
    if(page.seodescription!=null && page.seodescription!=""){
        arrMetaTags.push(`<meta name="twitter:description" content="${page.seodescription}">`);
    }
    arrMetaTags.push(`<link rel="canonical" href="${canonicalUrl}">`);
    arrMetaTags.push(`<meta property="og:locale" content="${curLang.codelang}">`);
    var checkNotEnglishEnable = (page.notenglish == undefined || page.notenglish == false);
    arrPageLangs.forEach(le => {
        if(checkNotEnglishEnable || (!checkNotEnglishEnable && le.ismain==false)){
            arrMetaTags.push(`<meta property="og:locale:alternate" content="${le.codelang}">`);
        }
    });
    /*
    arrMetaTags.push(`<link rel="alternate" hreflang="${curLang.codelang}" href="${canonicalUrl}">`);    
    if(checkNotEnglishEnable){
        arrMetaTags.push(`<link rel="alternate" hreflang="x-default" href="${domain}${urlNoneLang}">`);
    }
    arrPageLangs.forEach(le => {
        let urlAlt = (le.ismain) ? `${domain}` : `${domain}/${le.id}`;
        urlAlt = `${urlAlt}${urlNoneLang}`;
        if(checkNotEnglishEnable || (!checkNotEnglishEnable && le.ismain==false)){
            arrMetaTags.push(`<link rel="alternate" hreflang="${le.codelang}" href="${urlAlt}">`);
        }
    });
    */
    return arrMetaTags;
}

async function downloadMeta(curLang, curUrl, canonical, page, arrPageLangs) {
    var arrMetaTags = [];
    var urlNoneLang = (!curLang.ismain) ? curUrl.replace(new RegExp(`^\/${curLang.id}`, 'g'), "") : curUrl;
    urlNoneLang = (urlNoneLang == "") ? "/" : urlNoneLang;
    var canonicalUrl = (curLang.ismain) ? `${domain}${urlNoneLang}` : `${domain}/${curLang.id}${urlNoneLang}`;
    var robotFullText = "";
    robotFullText += (page.index == true) ? "index, " : "noindex, ";
    robotFullText += (page.follow == true) ? "follow" : "nofollow";
    var googlebotText = (page.index == true) ? "index" : "noindex";
    var googlebotNewsText = (page.index == true) ? "snippet" : "nosnippet";
    arrMetaTags.push(`<meta name="googlebot" content="${googlebotText}">`);
    arrMetaTags.push(`<meta name="googlebot-news" content="${googlebotNewsText}">`);
    arrMetaTags.push(`<meta name="robots" content="${robotFullText}">`);
    arrMetaTags.push(`<title>${page.seotitle}</title>`);
    if(page.seodescription!=null && page.seodescription!=""){
        arrMetaTags.push(`<meta name="description" content="${page.seodescription}">`);
    }
    arrMetaTags.push(`<meta property="og:type" content="${page.pagetype}">`);
    arrMetaTags.push(`<meta property="og:site_name" content="${sitename}">`);
    arrMetaTags.push(`<meta property="og:url" content="${canonicalUrl}">`);
    arrMetaTags.push(`<meta property="og:title" content="${page.seotitle}">`);
    if(page.seodescription!=null && page.seodescription!=""){
        arrMetaTags.push(`<meta property="og:description" content="${page.seodescription}">`);
    }
    arrMetaTags.push(`<meta name="twitter:card" content="summary_large_image">`);
    arrMetaTags.push(`<meta name="twitter:title" content="${page.seotitle}">`);
    if(page.seodescription!=null && page.seodescription!=""){
        arrMetaTags.push(`<meta name="twitter:description" content="${page.seodescription}">`);
    }
    arrMetaTags.push(`<link rel="canonical" href="${canonical}">`);    
    arrMetaTags.push(`<meta property="og:locale" content="${curLang.codelang}">`);
    var checkNotEnglishEnable = (page.notenglish == undefined || page.notenglish == false);
    arrPageLangs.forEach(le => {
        if(checkNotEnglishEnable || (!checkNotEnglishEnable && le.ismain==false)){
            arrMetaTags.push(`<meta property="og:locale:alternate" content="${le.codelang}">`);
        }
    });
    /*
    arrMetaTags.push(`<link rel="alternate" hreflang="${curLang.codelang}" href="${canonicalUrl}">`);    
    if(checkNotEnglishEnable){
        arrMetaTags.push(`<link rel="alternate" hreflang="x-default" href="${domain}${urlNoneLang}">`);
    }
    arrPageLangs.forEach(le => {
        let urlAlt = (le.ismain) ? `${domain}` : `${domain}/${le.id}`;
        urlAlt = `${urlAlt}${urlNoneLang}`;
        if(checkNotEnglishEnable || (!checkNotEnglishEnable && le.ismain==false)){
            arrMetaTags.push(`<link rel="alternate" hreflang="${le.codelang}" href="${urlAlt}">`);
        }
    });
    */
    return arrMetaTags;
}

async function homeMeta(curLang, curUrl, page, arrPageLangs) {
    var homeMeta = await baseMeta(curLang, curUrl, page, arrPageLangs),
        rootUrl = (curLang.ismain) ? domain : `${domain}/${curLang.id}`;
    homeMeta.push(`<link rel="alternate" type="application/rss+xml" href="${rootUrl}/${sitenameSlug}.rss" title="${sitename}">`);
    return homeMeta;
}

async function cateMeta(curLang, curUrl, page, arrPageLangs, rootUrl, curPage, maxPage) {
    var cateMeta = await baseMeta(curLang, curUrl, page, arrPageLangs);
    var arr = curUrl.split("?");
    var rootUrl = (arr.length >= 1) ? arr[0] : curUrl;
    rootUrl = rootUrl.replace(/\/$|\/page\/.*/g,"");
    var sort = (arr.length >= 2) ? `?${arr[1]}` : "";
    if (curPage > 1) {
        let prevUrl = (curPage - 1 == 1) ? `${rootUrl}/${sort}` : `${rootUrl}/page/${curPage - 1}${sort}`;
        cateMeta.push(`<link rel="prev" href="${domain}${prevUrl}">`);
    }
    if (curPage < maxPage) {
        cateMeta.push(`<link rel="next" href="${domain}${rootUrl}/page/${curPage + 1}${sort}">`);
    }
	if(page.cateslug){
        var domainLangUrl = (curLang.ismain) ? domain : `${domain}/${curLang.id}`;
        cateMeta.push(`<link rel="alternate" type="application/rss+xml" href="${domainLangUrl}/${sitenameSlug}-${page.cateslug}.rss" title="${page.seotitle}">`);
    }
    return cateMeta;
}
/* page {
    pagetype
    seotitle,
    seodescription,
    index,
    follow,
    publishat,
    modifyat,
    category,
    thumb:{
        url,
        childsizes
    }
} */
async function postMeta(curLang, curUrl, page, arrPageLangs) {
    var postMeta = await baseMeta(curLang, curUrl, page, arrPageLangs);
    var thumb = page.thumb || {};
    var thumbObj = (thumb.childsizes) ? thumb.childsizes.split(",") : [];
    var sizeArr = (thumbObj.length > 0) ? thumbObj[thumbObj.length - 1].split("x") : [];
    var width = sizeArr[0] || 0;
    var height = sizeArr[1] || 0;
    var pubdate = functions.formart_datetime(page.publishat, "seo");
    var moddate = functions.formart_datetime(page.modifyat, "seo");
    if (page.category)
        postMeta.push(`<meta property="article:section" content="${page.category}">`);
    postMeta.push(`<meta property="article:published_time" content="${pubdate}">`);
    postMeta.push(`<meta property="article:modified_time" content="${moddate}">`);
    postMeta.push(`<meta property="og:updated_time" content="${moddate}">`);
    if (width > 0)
        postMeta.push(`<meta property="og:image:width" content="512">`);
    if (height > 0)
        postMeta.push(`<meta property="og:image:height" content="250">`);
    if (thumb.url) {
        postMeta.push(`<meta property="og:image" content="${thumb.url}">`);
        postMeta.push(`<meta property="og:image:secure_url" content="${thumb.url}">`);
        postMeta.push(`<meta name="twitter:image" content="${thumb.url}">`);
    }
    return postMeta;
}

module.exports = {
    baseMeta,
    homeMeta,
    cateMeta,
    postMeta,
	downloadMeta
}