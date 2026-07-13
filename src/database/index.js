const path = require('node:path');
const { Sequelize } = require('sequelize');

const storage = process.env.DB_STORAGE
  ? path.resolve(process.env.DB_STORAGE)
  : path.resolve(__dirname, '../../data/marketplace.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: process.env.DB_LOG_SQL === 'true' ? console.log : false,
  define: {
    underscored: true,
    freezeTableName: true,
  },
});

const models = require('../models')(sequelize);

async function connectDatabase() {
  await sequelize.authenticate();
  await sequelize.query('PRAGMA foreign_keys = ON');
  return sequelize;
}

module.exports = {
  sequelize,
  models,
  connectDatabase,
};
