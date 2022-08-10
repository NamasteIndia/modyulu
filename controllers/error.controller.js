const { getMenuFontEnd } = require("./menu.controller");

function render403(req, res){
    return res.status(403).render("admin/403");
}

function render403Ajax(req, res){
    return res.status(403).json({code: 0, message: "Sorry, you're not authorized to access this site"});    
}

async function render404(req, res){
    //return res.status(404).render("admin/404");
    var curLang = req.curLang;
    var menuHeader = await getMenuFontEnd(curLang, 'menu-header', "404", 1, req.url);
    var menuFooter = await getMenuFontEnd(curLang, 'menu-footer', "404", 1, req.url);
    var page = {
        curLang: curLang,
        menuHeader: menuHeader,
        menuFooter: menuFooter
    }
    res.setLocale(curLang.id);
    return res.status(404).render("web/404", { page: page });
}

function render404Ajax(req, res){
    return res.status(404).json({code: 0, message: "Sorry, The site data not found"});
}

function render500(req, res){
    return res.status(500).render("admin/500");
}

function render500Ajax(req, res){
    return res.status(500).json({code: 0, message: "Sorry, this site can't be accessed now"});
}



module.exports = {
    render403,
    render403Ajax,
    render404,
    render404Ajax,
    render500,
    render500Ajax
}