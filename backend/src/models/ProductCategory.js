const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const Category = require("./Category");
const Product = require("./Product");

const ProductCategory = sequelize.define(
  "ProductCategory",
  {
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "products",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "categories",
        key: "id"
      },
      onDelete: "CASCADE"
    }
  },
  {
    tableName: "product_categories",
    timestamps: false
  }
);

Product.belongsToMany(Category, {
  as: "categories",
  through: ProductCategory,
  foreignKey: "product_id",
  otherKey: "category_id",
  onDelete: "CASCADE"
});
Category.belongsToMany(Product, {
  as: "products",
  through: ProductCategory,
  foreignKey: "category_id",
  otherKey: "product_id",
  onDelete: "CASCADE"
});

module.exports = ProductCategory;
