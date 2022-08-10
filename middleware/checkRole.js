const { getRoleActionOfUrl } = require('../controllers/rolefeature.controller');
function checkRole(root){
    return async function (req, res, next){
        var role = req.session.role;
        var url = `/${root}${req.url}`;
        var roleAction = await getRoleActionOfUrl(role, url);        
        if(roleAction == null){
            if(req.method == "GET"){
                return res.status(403).render("admin/403");
            }else{
                return res.status(403).json({code:0, message: "Unauthorized"});
            }
        }
        req.roleAction = roleAction;
        next();
    }
}

module.exports = {
    checkRole
}