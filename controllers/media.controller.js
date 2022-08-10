const db = require('../models');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
sharp.cache(false);
const config = require('config');
const Op = db.Sequelize.Op;
const sequelize = db.sequelize;
const Media = db.media;
const User = db.user;
const Option = db.option;
var url = require('url'),
  https = require('https');
const functions = require('../libs/functions');
const optimizeAllowId = 'off_optimze_image_upload';
const errorController = require('./error.controller');
var mediaconf = config.get('media');
var curDate = new Date();
var folder = './uploads/'.concat(curDate.getFullYear(), '/', curDate.getMonth() + 1);
var foldercheck = 'uploads/'.concat(curDate.getFullYear(), '/', curDate.getMonth() + 1);

// Kiem tra filename va thu muc chua file co ton tai khong
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(foldercheck, { recursive: true });
    //if (!fs.existsSync(foldercheck)) fs.mkdirSync(foldercheck,'0777', true);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    var objoname = functions.ext_from_name(file.originalname),
      fileslug = functions.convert_slug(objoname.name),
      extension = objoname.ext,
      filename = `${fileslug}.${extension}`;
    Media.count({
      where: {
        filename: {
          [Op.like]: `${fileslug}%`,
        },
      },
    })
      .then((numExists) => {
        fileslug = file.mimetype.startsWith('image/') ? `${fileslug}-origin` : fileslug;
        filename =
          numExists > 0 ? `${fileslug}-${numExists}.${extension}` : `${fileslug}.${extension}`;
        cb(null, filename);
      })
      .catch((err) => {
        cb(new multer.MulterError(err.message));
      });
  },
});
// Kiem tra filetype hop le khong
var uploadSingle = multer({
  storage: storage,
  fileSize: 1024 * 1024 * mediaconf.filesize, //Mb
  fileFilter: (req, file, cb) => {
    var arrMimetype = mediaconf.filetypes;
    if (!arrMimetype.includes(file.mimetype)) {
      cb(new multer.MulterError('This file is not support'));
    } else {
      cb(null, true);
    }
  },
}).single('file');
// Upload 1 file tu Form
exports.UploadSingle = (req, res) => {
  uploadSingle(req, res, function (err) {
    if (err || req.file === undefined) {
      res.json({ code: 0, message: err.code });
    } else {
      var fileName = req.file.filename,
        originNameObj = functions.ext_from_name(req.file.originalname),
        realPath = `${req.file.destination}/${fileName}`,
        destination = req.file.destination.replace('./', ''),
        extension = originNameObj.ext,
        mediaData = {},
        fileTitle = originNameObj.name.replace(/\-/g, ' ');
      mediaData.title = fileTitle;
      mediaData.filename = fileName;
      mediaData.url = `${domain}/${destination}/${fileName}`;
      mediaData.urlicon = `${domain}/uploads/icons/file-icon.png`;
      mediaData.filetype = req.file.mimetype;
      mediaData.filesize = functions.calc_filesize(req.file.size);
      mediaData.type = 'file';
      mediaData.author = req.session.userid ? req.session.userid : null;
      if (req.file.mimetype.includes('image/')) {
        Option.findOne({
          where: {
            metakey: optimizeAllowId,
          },
        }).then((option) => {
          const imgsharp = sharp(realPath);
          var optimizAllow = option != null && option.metavalue == 'true' ? true : false;
          var sizes = [];
          /*
                    if (!optimizAllow) {
                        if (extension == "png") {
                            imgsharp.png({ compressionLevel: mediaconf.optimize.compressionlevel, adaptiveFiltering: true, force: true }).toBuffer();
                        } else {
                            imgsharp.jpeg({ quality: mediaconf.optimize.quality }).toBuffer();
                        }
                    }								
                    imgsharp.toFile(realPath.replace(/-origin/g, ""));
					*/
          if (!optimizAllow) {
            if (extension == 'png') {
              imgsharp
                .png({
                  compressionLevel: mediaconf.optimize.compressionlevel,
                  adaptiveFiltering: true,
                  force: true,
                })
                .toBuffer();
            } else {
              imgsharp.jpeg({ quality: mediaconf.optimize.quality }).toBuffer();
            }
            imgsharp.toFile(realPath.replace(/-origin/g, ''));
          } else {
            fs.copyFile(realPath, realPath.replace(/-origin/g, ''), (err) => {
              if (err) throw err;
            });
          }
          imgsharp.resize(150, 150).toFile(realPath.replace(/-origin/g, '-150'));
          imgsharp.metadata().then((metadata) => {
            mediaconf.widths.forEach((w) => {
              if (w < metadata.width) {
                var h = Math.ceil(metadata.height * (w / metadata.width));
                sizes.push(`${w}x${h}`);
                imgsharp.resize(w).toFile(realPath.replace(/-origin/g, `-${w}`));
              }
            });
            sizes.push(`${metadata.width}x${metadata.height}`);
            var type = req.body.type;
            type =
              type == undefined || type == '' || type == null || type == 'editor' ? 'image' : type;
            mediaData.filename = fileName.replace(/-origin/g, '');
            mediaData.url = `${domain}/${destination}/${fileName.replace(/-origin/g, '')}`;
            mediaData.urlicon = `${domain}/${destination}/${fileName.replace(/-origin/g, '-150')}`;
            mediaData.imgwidth = metadata.width;
            mediaData.imgheight = metadata.height;
            mediaData.childsizes = sizes.join(',');
            mediaData.type = type;
            Media.create(mediaData)
              .then((media) => {
                res.json({ code: 1, message: 'Upload successfully', data: media });
              })
              .catch((err) => {
                res.json({ code: 0, message: err.message, data: req.file });
              });
          });
        });
      } else {
        Media.create(mediaData)
          .then((media) => {
            res.json({ code: 1, message: 'Upload successfully', data: media });
          })
          .catch((err) => {
            res.json({ code: 0, message: err.message, data: req.file });
          });
      }
    }
  });
};
// Upload 1 file tu duong dan http
exports.UploadFormUrl = (req, res) => {
  try {
    var imgurl = req.body.imgurl;
    var options = url.parse(imgurl);
    options = {
      ...options,
      headers: {
        Connection: 'keep-alive',
      },
    };

    if (options.protocol.startsWith('https')) {
      https.get(options, function (response) {
        var chunks = [];
        response
          .on('data', function (chunk) {
            chunks.push(chunk);
          })
          .on('end', function () {
            const buffer = Buffer.concat(chunks);
            const imgsharp = sharp(buffer);
            fs.mkdirSync(foldercheck, { recursive: true });
            Option.findOne({
              where: {
                metakey: optimizeAllowId,
              },
            })
              .then((option) => {
                imgsharp
                  .metadata()
                  .then((metadata) => {
                    var optimizAllow = option != null && option.metavalue == 'true' ? true : false,
                      //extension = metadata.format == 'jpeg' ? 'jpg' : metadata.format,
                      extension = 'jpg',
                      title = req.body.title || '',
                      type = req.body.type || '',
                      imageslug = functions.convert_slug(`${title} ${type}`),
                      destination = '',
                      filetype = 'image/jpeg',
                      sizes = [];
                    Media.count({
                      where: {
                        filename: {
                          [Op.like]: `${imageslug}%`,
                        },
                      },
                    })
                      .then((numExists) => {
                        imageslug = numExists > 0 ? `${imageslug}-${numExists}` : imageslug;
                        destination = `${folder}/${imageslug}`;
                        /*
							if (!optimizAllow) {
                                if (extension == "png") {
                                    filetype = "image/png"
                                    imgsharp.png({ compressionLevel: mediaconf.optimize.compressionlevel, adaptiveFiltering: true, force: true }).toBuffer();
                                } else {
                                    imgsharp.jpeg({ quality: mediaconf.optimize.quality }).toBuffer();
                                }
                            }
                            imgsharp.toFile(`${destination}.${extension}`);
							*/
                        if (!optimizAllow) {
                          if (extension == 'png') {
                            imgsharp
                              .png({
                                compressionLevel: mediaconf.optimize.compressionlevel,
                                adaptiveFiltering: true,
                                force: true,
                              })
                              .toBuffer();
                          } else {
                            imgsharp.jpeg({ quality: mediaconf.optimize.quality }).toBuffer();
                          }
                          imgsharp.toFile(`${destination}.${extension}`);
                        } else {
                          fs.writeFile(
                            `${destination}.${extension}`,
                            buffer,
                            'binary',
                            function (err) {}
                          );
                        }
                        imgsharp.resize(150, 150).toFile(`${destination}-150.${extension}`);
                        mediaconf.widths.forEach((w) => {
                          if (w < metadata.width) {
                            var h = Math.ceil(metadata.height * (w / metadata.width));
                            sizes.push(`${w}x${h}`);
                            imgsharp.resize(w).toFile(`${destination}-${w}.${extension}`);
                          }
                        });
                        sizes.push(`${metadata.width}x${metadata.height}`);
                        destination = destination.replace('./', '');
                        Media.create({
                          title: title,
                          note: type,
                          filename: `${imageslug}.${extension}`,
                          url: `${domain}/${destination}.${extension}`,
                          urlicon: `${domain}/${destination}-150.${extension}`,
                          filetype: filetype,
                          filesize: functions.calc_filesize(metadata.size),
                          imgwidth: metadata.width,
                          imgheight: metadata.height,
                          childsizes: sizes.join(','),
                          type: type,
                          author: req.session.userid ? req.session.userid : null,
                        })
                          .then((media) => {
                            res.json({ code: 1, message: 'Upload successfully', data: media });
                          })
                          .catch((err) => {
                            res.json({ code: 0, message: err.message });
                          });
                      })
                      .catch((err) => {
                        console.log('🚀 ~ file: media.controller.js ~ line 273 ~ .then ~ err', err);
                        res.json({ code: 0, message: err.message });
                      });
                  })
                  .catch((err) => {
                    res.json({ code: 0, message: err.message });
                  });
              })
              .catch((err) => {
                res.json({ code: 0, message: err.message });
              });
          })
          .on('connection', function (socket) {
            socket.setTimeout(30 * 1000);
          })
          .on('error', function (err) {
            res.json({ code: 0, message: err.message || 'Https Error Socket' });
          });
      });
    } else {
      res.json({ code: 0, message: 'Url is incorrect' });
    }
  } catch (err) {
    console.log(err);
    res.json({ code: 0, message: 'Error' });
  }
};
// Hien thi danh sach Media
exports.ListMedia = async (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actview) {
      return errorController.render403(req, res);
    }
    var months = await Media.findAll({
      attributes: [[sequelize.fn('date_format', sequelize.col('created_at'), '%m-%Y'), 'month']],
      group: 'month',
      limit: 12,
      raw: true,
    });
    res.render('admin/media', { months });
  } catch (err) {
    return errorController.render500(req, res);
  }
};
// Hien thi trang Upload media
exports.NewMedia = (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actadd) {
      return errorController.render403(req, res);
    }
    res.render('admin/media-add');
  } catch (err) {
    return errorController.render500(req, res);
  }
};
// Lay thong tin 1 file
exports.findOne = (req, res) => {
  try {
    if (!req.roleAction || !req.roleAction.actview) {
      return errorController.render403Ajax(req, res);
    }
    var id = req.params.id || req.query.id || req.body.id;
    Media.findOne({
      where: {
        id,
      },
    }).then((data) => {
      if (data != null) {
        res.json({ code: 1, message: 'Success', data: data });
      } else {
        res.json({ code: 0, message: 'File not exist' });
      }
    });
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};
// Thuc hien sua thong tin file
exports.EditMedia = async (req, res) => {
  try {
    var id = req.body.id || '';
    var media = await Media.findOne({
      where: {
        id: id,
      },
    });
    if (media == null) {
      return errorController.render404Ajax(req, res);
    }
    if (media.author !== req.session.userid) {
      if (!req.roleAction || !req.roleAction.actedit) {
        return errorController.render403Ajax(req, res);
      }
    }
    media.title = req.body.title || req.body.seotitle;
    media.seotitle = req.body.seotitle || '';
    media.note = req.body.note || '';
    media.description = req.body.description || '';
    media.save();
    return res.json({ code: 1, message: 'File was updated success' });
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};
// Thuc hien sua thong tin file
exports.Bulk = async (req, res) => {
  var id = req.body.id,
    action = req.body.action;
  switch (action) {
    case 'delete':
      req.body.id = id;
      this.DeleteMedia(req, res);
      break;
    default:
      res.json({ code: 0, message: 'Unknow this bulk action' });
      break;
  }
};
// Xoa 1 file
exports.DeleteMedia = (req, res) => {
  try {
    var id = req.params.id || req.body.id || '',
      where = {
        id: id,
      };
    if (!req.roleAction || !req.roleAction.actdel) {
      where.author = req.session.userid || '';
    }
    Media.destroy({
      where: where,
    })
      .then((media) => {
        if (media == 0) {
          return res.json({ code: 0, message: "This file can't delete" });
        }
        res.json({ code: 1, message: 'File was deleted successfully' });
      })
      .catch((error) => {
        res.json({ code: 0, message: error.message });
      });
  } catch (err) {
    return errorController.render500Ajax(req, res);
  }
};
// Phan trang Media
exports.Datatable = async (req, res) => {
  try {
    var search = req.query.columns[1].search.value;
    var month = req.query.columns[2].search.value;
    month = month == undefined || month == '' || month == null ? '%' : month;
    var where = {
        [Op.or]: {
          title: {
            [Op.like]: `%${search}%`,
          },
          note: {
            [Op.like]: `%${search}%`,
          },
          description: {
            [Op.like]: `%${search}%`,
          },
        },
      },
      column = 'id';
    if (month != '%') {
      var objday = functions.frist_last_dayofmonth(month);
      where = {
        [Op.and]: [
          {
            title: {
              [Op.like]: `%${search}%`,
            },
          },
          {
            created_at: {
              [Op.gte]: objday.fday,
              [Op.lte]: objday.lday,
            },
          },
        ],
      };
    }
    var start = Number(req.query.start);
    var length = Number(req.query.length);
    if (req.query.order[0].column == 1) column = 'title';
    if (req.query.order[0].column == 3) column = 'seotitle';
    if (req.query.order[0].column == 4) column = 'filesize';
    if (req.query.order[0].column == 5) column = 'created_at';
    var type = req.query.order[0].dir;
    var roleAction = req.roleAction ? req.roleAction : {};
    if (Number.isInteger(start) && Number.isInteger(length)) {
      var media = await Media.findAndCountAll({
        where: where,
        include: [
          {
            model: User,
            as: 'Author',
            attributes: ['id', 'username'],
          },
        ],
        attributes: {
          include: [
            [sequelize.literal(`${roleAction.actview ? roleAction.actview : 0}`), 'roleview'],
            [sequelize.literal(`${roleAction.actadd ? roleAction.actadd : 0}`), 'roleadd'],
            [sequelize.literal(`${roleAction.actedit ? roleAction.actedit : 0}`), 'roleedit'],
            [sequelize.literal(`${roleAction.actdel ? roleAction.actdel : 0}`), 'roledel'],
            [sequelize.literal(`${req.session.userid}`), 'mine'],
          ],
        },
        order: [[column, type]],
        offset: start,
        limit: length,
      });
      res.json({
        aaData: media.rows,
        iTotalDisplayRecords: media.count,
        iTotalRecords: media.count,
      });
    } else {
      res.json({ code: 0, message: 'Pagination params is not valid' });
    }
  } catch (err) {
    res.json({ code: 0, message: 'Error page' });
  }
};
// Phan trang Media trong Modal Media
exports.ListMediaModal = async (req, res) => {
  try {
    var where = {},
      op = [],
      search = req.query.search,
      month = req.query.month,
      type = req.query.type,
      unlessids = req.query.unlessids;
    search = search == undefined && search == '%' && search == null ? '' : search;
    type = ['image', 'icon', 'thumbnail', 'screenshoot'].includes(type) ? type : '';
    if (search != '') {
      op.push({
        title: {
          [Op.like]: `%${search}%`,
        },
      });
    }
    if (Array.isArray(unlessids)) {
      op.push({
        id: {
          [Op.notIn]: unlessids,
        },
      });
    }
    if (type != '') {
      op.push({
        type: type,
      });
    }
    if (month != undefined && month != '%' && month != null) {
      var objday = functions.frist_last_dayofmonth(month);
      op.push({
        created_at: {
          [Op.gte]: objday.fday,
          [Op.lte]: objday.lday,
        },
      });
    }
    if (op.length > 0) {
      where = {
        [Op.and]: op,
      };
    }
    var offset = 0;
    var length = 50;
    if (Number.isInteger(offset) && Number.isInteger(length)) {
      var media = await Media.findAndCountAll({
        where: where,
        offset: offset,
        order: [['createdAt', 'desc']],
        limit: length,
      });
      res.json({ code: 1, message: 'Successful', data: media.rows, count: media.count });
    } else {
      res.json({ code: 0, message: 'Pagination params is not valid' });
    }
  } catch (err) {
    res.json({ code: 0, message: 'Error' });
  }
};
// Lay danh sach thang cho Modal media
exports.ListMediaModalInit = async (req, res) => {
  try {
    var isimg = req.query.isimg;
    var where = {};
    if (isimg == 'true') {
      where = {
        filetype: {
          [Op.like]: `image%`,
        },
      };
    }
    var months = await Media.findAll({
      attributes: [[sequelize.fn('date_format', sequelize.col('created_at'), '%m-%Y'), 'month']],
      where: where,
      group: 'month',
      raw: true,
    });
    var total = await Media.count({ where: where });
    res.json({ code: 1, message: 'Successful', data: { months: months, total: total } });
  } catch (err) {
    res.json({ code: 0, message: 'Error' });
  }
};

// Avatar
// Kiem tra filename va thu muc chua file co ton tai khong
var storageAvatar = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(foldercheck, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    var username = req.session.username || '';
    cb(null, `${username}.jpg`);
  },
});
// Kiem tra filetype hop le khong
var uploadSingleAvatar = multer({
  storage: storageAvatar,
  fileSize: 1024 * 1024 * 10, //Mb
  fileFilter: (req, file, cb) => {
    var arrMimetype = ['image/jpeg'];
    if (!arrMimetype.includes(file.mimetype)) {
      cb(new multer.MulterError('Only support JPG'));
    } else {
      cb(null, true);
    }
  },
}).single('file');
// Upload 1 file tu Form
exports.UploadAvatar = (req, res) => {
  try {
    var userid = req.session.userid || '';
    if (userid == '') {
      return errorController.render403Ajax(req, res);
    }
    req.body.username = req.session.username;
    uploadSingleAvatar(req, res, function (err) {
      if (err || req.file === undefined) {
        var msg = err.code ? err.code : 'Sorry, try again later';
        return res.json({ code: 0, message: msg });
      } else {
        var realPath = `${req.file.destination}/${req.session.username}.jpg`;
        var id = new Date().getTime();
        id = `${userid}${id}`;
        var avatarPath = `${req.file.destination}/${id}.jpg`;
        const imgsharp = sharp(realPath);
        imgsharp
          .resize(150, 150)
          .toFile(avatarPath)
          .then(() => {
            avatarPath = avatarPath.replace(/^\./g, '');
            User.update(
              {
                avatar: avatarPath,
              },
              {
                where: {
                  id: userid,
                },
              }
            );
            req.session.avatar = avatarPath;
            return res.json({ code: 1, message: 'Successfully', img: avatarPath });
          });
      }
    });
  } catch (err) {
    return res.json({ code: 0, message: 'Sorry, try again later 3' });
  }
};
