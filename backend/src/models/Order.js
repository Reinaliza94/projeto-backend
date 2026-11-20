const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const User = require("./User");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "placed"
    }
  },
  {
    tableName: "orders",
    timestamps: true,
    underscored: true
  }
);

User.hasMany(Order, {
  as: "orders",
  foreignKey: "user_id",
  onDelete: "CASCADE"
});
Order.belongsTo(User, {
  as: "user",
  foreignKey: "user_id",
  onDelete: "CASCADE"
});

module.exports = Order;
