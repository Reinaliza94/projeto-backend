const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const Product = require("./Product");

const ProductOption = sequelize.define(
  "ProductOption",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    shape: {
      type: DataTypes.ENUM("square", "circle"),
      allowNull: true,
      defaultValue: "square",
      validate: {
        isIn: [["square", "circle"]]
      }
    },
    radius: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    type: {
      type: DataTypes.ENUM("text", "color"),
      allowNull: true,
      defaultValue: "text",
      validate: {
        isIn: [["text", "color"]]
      }
    },
    values: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: "product_options",
    timestamps: false
  }
);

Product.hasMany(ProductOption, {
  as: "options",
  foreignKey: "product_id",
  onDelete: "CASCADE"
});
ProductOption.belongsTo(Product, {
  as: "product",
  foreignKey: "product_id",
  onDelete: "CASCADE"
});

module.exports = ProductOption;
