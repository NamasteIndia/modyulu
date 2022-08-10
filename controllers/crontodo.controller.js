const request = require('request-promise');
const config = require("config");
const tableCf = config.get('database.table');
const apkleechCf = config.get("apkleech");
const db = require("../models");
const sequelize = db.sequelize;
const tbPostName = tableCf.prefix + "posts";
const tbApkMetaName = tableCf.prefix + "apkmeta";
const tbTodoName = tableCf.prefix + "cron_todos";
const Crontodo = db.crontodo;
const LogApkFile = db.logapkfile;
const ApkMeta = db.apkmeta;
const LogApkFileController = require('./logapkfile.controller');

// Thuc hien tao to do list cho cron check apk version tu google play
// Khi cron da thuc hien het cac to do list cu, se thuc hien tao moi
async function createTodoList(){
    try{
        const query = `INSERT INTO ${tbTodoName} (postid, title, package_name, oldversion, oldsize, scheduletime) SELECT m.postid, p.title, m.package_name, m.version, m.apk_size, NOW()
                        FROM ${tbApkMetaName} m, ${tbPostName} p
                        WHERE p.id=m.postid AND p.poststatus = 'published' AND p.publishedat <= NOW() AND m.off_update_version = false
                        ORDER BY p.viewcountday DESC`;
        await sequelize.query(query, {type: sequelize.QueryTypes.INSERT}).then(posts =>{
            return posts;
        }).catch(() =>{
            return null;
        });
    }catch(err){
        return null;
    }
}
// Thuc hien cron check version
// Cu moi 2 phut cron check [apkleech.cronrows] apps
async function execTodoList(){
    try{
        var length = apkleechCf.cronrows || 20;
        var todolist = await Crontodo.findAll({
            where :{
                isdone: false
            },
            limit: length
        });
        todolist = (todolist) ? todolist : [];
        if(todolist.length <= 0){
            await this.createTodoList();
        }else{        
            todolist.forEach(async todo => {
                var leechAppOption = {
                        method: 'GET',
                        uri: `${apkleechCf.getfile}${todo.package_name}`,
                        json: true
                    },
                    nVersion = todo.oldversion || "",
                    nSize = todo.oldsize || "";
                await request(leechAppOption).then(async function(rs) {
                    if(rs.AppVersion !== undefined){
                        nVersion = rs.AppVersion || "",
                        nSize = rs.ApkSize || "";
                        nSize = (nSize!="") ? functions.calc_filesize(nSize) : "";
                        var apkMeta = await ApkMeta.findOne({where:{postid: todo.postid}, attributes:['version']}),
                            oldversion = (apkMeta!=null) ? apkMeta.version : todo.oldversion;
                        if(nVersion != oldversion){
                            await LogApkFile.update({
                                isloaded: false,
                                isnolink: false,
                                apkversion: nVersion,
                                apksize: nSize
                            },{
                                where: {
                                    postid: todo.postid
                                }
                            });
                            // thuc hien update
                            await LogApkFileController.changeVersionApk(todo.postid, nVersion, nSize, "Khi hệ thống chạy Auto update");
                        }
                    }
                    await Crontodo.update({
                        newversion: nVersion,
                        newsize: nSize,
                        isdone: true,
                        iscantleech: false
                    },{
                        where :{
                            id : todo.id
                        }
                    });
                }).catch(async () =>{
                    await Crontodo.update({
                        isdone: true,
                        iscantleech: true
                    },{
                        where :{
                            id : todo.id
                        }
                    });
                })
            });
        }
    }catch(err){
        console.log(err);
    }
}
// lay danh sach to do list chuan bi chay tren Dashboard
async function getTodoList(){
    try{
        var apkleechLength = apkleechCf.cronrows || 20;
        var todoList = await Crontodo.findAndCountAll({
            where:{
                isdone: false
            },
            limit: apkleechLength
        });
        return todoList;
    }catch(err){        
        return {count: 0, rows: []};
    }
}

module.exports = {
    createTodoList,
    execTodoList,
    getTodoList
}