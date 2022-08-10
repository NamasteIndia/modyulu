const db = require('../models');
const Category = db.category;
// Tạo pagination cho category + Blog + App
exports.createBreadcumb = async (lastCateId, curLang, lastItemTitle, curPageUrl, homeText, hierarchyCate) => {
    try {
        var breadcumbs = (hierarchyCate) ? hierarchyCate : [];
        var homeTitle = (homeText) ? homeText : 'Home';
        var rootUrl = (!curLang.ismain) ? `${domain}/${curLang.id}` : domain;
        var arrBreadcumbs = [];
        var breadcrumbID = curPageUrl.replace(new RegExp(`^\/${curLang.id}`, "g"), "");
        breadcrumbID = (breadcrumbID == "") ? `${domain}/${curLang.id}/` : `${domain}${curPageUrl}`;
        var homeUrl = `${rootUrl}/`;
        var schema = {
            "@context": "https://schema.org",
            "@id": `${breadcrumbID}#breadcrumb`,
            "@type": "BreadcrumbList",
            "itemListElement": []
        };
        schema["itemListElement"].push({
            "@type": "ListItem",
            "position": 1,
            "item": {
                "@type": "WebPage",
                "@id": homeUrl,
                "url": homeUrl,
                "name": sitename
            }
        });
        arrBreadcumbs.push(`<div id="breadcrumb" class="breadcumb"><ul>`);
        arrBreadcumbs.push(`<li><a href="${rootUrl}">${homeTitle}</a></li>`);
        if (lastCateId != null && breadcumbs.length==0) {
            //breadcumbs = await Category.findAllParents(lastCateId);
            breadcumbs = await Category.findAllParentsSEO(lastCateId, curLang.id);
        }
        breadcumbs = (breadcumbs == null) ? [] : breadcumbs;
        var maxLoop = breadcumbs.length - 1;
        var slug = "";
        for (let i = 0; i <= maxLoop; i++) {
            slug = slug.concat("/", breadcumbs[i].slug);
            let url = `${rootUrl}${slug}/`;
            let title = breadcumbs[i].title;
            schema["itemListElement"].push({
                "@type": "ListItem",
                "position": i + 2,
                "item": {
                    "@type": "WebPage",
                    "@id": url,
                    "url": url,
                    "name": title
                }
            });
            //arrBreadcumbs.push(`<i class="tb-icon icon-angle-right"></i>`);
            if (i == maxLoop && lastItemTitle == null) {
                arrBreadcumbs.push(`<li><span>${title}</span></li>`);
            } else {
                arrBreadcumbs.push(`<li><a href="${url}">${title}</a></li>`);
            }
        }
        if (lastItemTitle != null) {
            arrBreadcumbs.push(`<li><span>${lastItemTitle}</span></li>`);
            let url = `${domain}${curPageUrl}`;
            url += (url.match(/\/$/g)) ? "" : "/";
            schema["itemListElement"].push({
                "@type": "ListItem",
                "position": maxLoop + 3,
                "item": {
                    "@type": "WebPage",
                    "@id": url,
                    "url": url,
                    "name": lastItemTitle
                }
            });
        }
        arrBreadcumbs.push(`</ul></div>`);
        var rs = { html: arrBreadcumbs.join(""), schema: JSON.stringify(schema) };
        return rs;
    } catch (err) {
        return {};
    }
}
// Tao breadcumb cho Ringtones
exports.createBreadcumbRingtones = async (cateRingtone, pageRingtone, curLang, curPageUrl, homeText) => {
    try {
        var homeTitle = (homeText) ? homeText : 'Home';
        var rootUrl = (!curLang.ismain) ? `${domain}/${curLang.id}` : domain;
        var arrBreadcumbs = [];
        var breadcrumbID = curPageUrl.replace(new RegExp(`^\/${curLang.id}`, "g"), "");
        breadcrumbID = (breadcrumbID == "") ? `${domain}/${curLang.id}/` : `${domain}${curPageUrl}`;
        var homeUrl = `${rootUrl}/`;
        // Note Home
        var schema = {
            "@context": "https://schema.org",
            "@id": `${breadcrumbID}#breadcrumb`,
            "@type": "BreadcrumbList",
            "itemListElement": []
        };
        schema["itemListElement"].push({
            "@type": "ListItem",
            "position": 1,
            "item": {
                "@type": "WebPage",
                "@id": homeUrl,
                "url": homeUrl,
                "name": sitename
            }
        });
        arrBreadcumbs.push(`<div class="breadcumb"><ul>`);
        arrBreadcumbs.push(`<li><a class="entry-crumb" href="${rootUrl}">${homeTitle}</a></li>`);
        if(cateRingtone==null){
            // Tao breadcumb cho page Ringtones
            arrBreadcumbs.push(`<li><span>${pageRingtone.title}</span></li>`);
            schema["itemListElement"].push({
                "@type": "ListItem",
                "position": 2,
                "item": {
                    "@type": "WebPage",
                    "@id": domain + curPageUrl + "/",
                    "url": domain + curPageUrl + "/",
                    "name": pageRingtone.title
                }
            });
        }else{
            // Tao breadcumb cho post Ringtones
            // Note Ringtones
            var noteUrl = `${rootUrl}/${cateRingtone.slug}/`;
            arrBreadcumbs.push(`<li><a href="${noteUrl}">${cateRingtone.title}</a></li>`);
            schema["itemListElement"].push({
                "@type": "ListItem",
                "position": 2,
                "item": {
                    "@type": "WebPage",
                    "@id": noteUrl,
                    "url": noteUrl,
                    "name": cateRingtone.title
                }
            });
            // Last note
            arrBreadcumbs.push(`<li><span>${pageRingtone.title}</span></li>`);
            schema["itemListElement"].push({
                "@type": "ListItem",
                "position": 3,
                "item": {
                    "@type": "WebPage",
                    "@id": domain + curPageUrl + "/",
                    "url": domain + curPageUrl + "/",
                    "name": pageRingtone.title
                }
            });
        }        
        arrBreadcumbs.push(`</div>`);
        var rs = { html: arrBreadcumbs.join(""), schema: JSON.stringify(schema) };
        return rs;
    } catch (err) {
        return {};
    }
}