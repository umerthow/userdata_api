const conf = require('config');
const Sequelize = require('sequelize');

const db = conf.db;
const dbSeq = new Sequelize(db.name, db.user, db.password, db);

dbSeq.authenticate().then(() => {
  console.log('Connection has been established successfully.');
}).catch(err => {
  console.error('Unable to connect to the database: ', err);
});

module.exports = dbSeq
