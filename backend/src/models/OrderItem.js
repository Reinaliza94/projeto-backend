const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const Order = require("./Order");
const Product = require("./Product");

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "products",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    unit_price: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    selected_color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    selected_size: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: "order_items",
    timestamps: false,
    underscored: true
  }
);

Order.hasMany(OrderItem, {
  as: "items",
  foreignKey: "order_id",
  onDelete: "CASCADE"
});
OrderItem.belongsTo(Order, {
  as: "order",
  foreignKey: "order_id",
  onDelete: "CASCADE"
});
Product.hasMany(OrderItem, {
  as: "order_items",
  foreignKey: "product_id",
  onDelete: "SET NULL"
});
OrderItem.belongsTo(Product, {
  as: "product",
  foreignKey: "product_id",
  onDelete: "SET NULL"
});

module.exports = OrderItem;
