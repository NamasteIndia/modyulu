// Auto create table with its data into the database
console.log('Start migrate DB');
const db = require('../models');
const initController = require('../controllers/initdb.controller');
db.sequelize.sync({ force: true, alter: true }).then(() => {
  initController.initial();
  console.log('End migrate DB');
});
