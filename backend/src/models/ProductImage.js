const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const Product = require("./Product");

const ProductImage = sequelize.define(
  "ProductImage",
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
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: "product_images",
    timestamps: false
  }
);

Product.hasMany(ProductImage, {
  as: "images",
  foreignKey: "product_id",
  onDelete: "CASCADE"
});
ProductImage.belongsTo(Product, {
  as: "product",
  foreignKey: "product_id",
  onDelete: "CASCADE"
});

module.exports = ProductImage;
