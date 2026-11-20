const path = require("node:path");
const { Sequelize } = require("sequelize");

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(__dirname, "../../database.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: databasePath,
  logging: false
});

module.exports = sequelize;
