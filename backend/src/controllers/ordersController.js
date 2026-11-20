const { Op } = require("sequelize");
const sequelize = require("../config/sequelize");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");
const User = require("../models/User");

function invalidItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return ["items"];
  }

  const invalidFields = [];
  items.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      invalidFields.push(`items[${index}]`);
      return;
    }

    if (!Number.isSafeInteger(item.productId) || item.productId < 1) {
      invalidFields.push(`items[${index}].productId`);
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      invalidFields.push(`items[${index}].quantity`);
    }

    for (const field of ["selectedColor", "selectedSize"]) {
      if (
        item[field] !== undefined &&
        item[field] !== null &&
        (typeof item[field] !== "string" && typeof item[field] !== "number")
      ) {
        invalidFields.push(`items[${index}].${field}`);
      }
    }
  });

  return invalidFields;
}

function imageContent(imagePath) {
  if (!imagePath) {
    return "";
  }
  if (/^(?:https?:)?\/\//i.test(imagePath) || imagePath.startsWith("/")) {
    return imagePath;
  }
  return `/media/${imagePath.replace(/\\/g, "/")}`;
}

function serializeOrder(order) {
  const plainOrder = order.get({ plain: true });
  return {
    id: plainOrder.id,
    createdAt: plainOrder.createdAt,
    total: plainOrder.total,
    status: plainOrder.status,
    items: plainOrder.items.map((item) => ({
      cartItemId: `${item.product_id ?? "removed"}-${item.selected_color ?? ""}-${item.selected_size ?? ""}-${item.id}`,
      productId: item.product_id,
      name: item.product_name,
      image: item.image ?? "",
      priceDiscount: item.unit_price,
      quantity: item.quantity,
      selectedColor: item.selected_color,
      selectedSize: item.selected_size
    }))
  };
}

async function list(request, response) {
  if (!request.userId) {
    return response.status(401).json({ error: "Usuário não autenticado" });
  }

  const orders = await Order.findAll({
    where: { user_id: request.userId },
    include: [{ model: OrderItem, as: "items" }],
    order: [["createdAt", "DESC"], ["id", "DESC"]]
  });
  return response.json(orders.map(serializeOrder));
}

async function create(request, response) {
  if (!request.userId) {
    return response.status(401).json({ error: "Usuário não autenticado" });
  }

  const items = request.body?.items;
  const invalidFields = invalidItems(items);
  if (invalidFields.length > 0) {
    return response.status(400).json({
      error: "Itens do pedido inválidos",
      fields: invalidFields
    });
  }

  const user = await User.findByPk(request.userId);
  if (!user) {
    return response.status(401).json({ error: "Usuário não autenticado" });
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await Product.findAll({
    where: { id: { [Op.in]: productIds } },
    include: [{ model: ProductImage, as: "images", attributes: ["id", "path"] }]
  });
  const productsById = new Map(products.map((product) => [product.id, product]));
  const missingProduct = items.find(
    (item) =>
      !productsById.has(item.productId) ||
      productsById.get(item.productId).enabled === false
  );
  if (missingProduct) {
    return response.status(400).json({
      error: "Um ou mais produtos do carrinho não estão disponíveis"
    });
  }

  const orderItems = items.map((item) => {
    const product = productsById.get(item.productId);
    const image = product.images
      .slice()
      .sort((left, right) => left.id - right.id)[0];

    return {
      product_id: product.id,
      product_name: product.name,
      image: imageContent(image?.path),
      unit_price: product.price_with_discount,
      quantity: item.quantity,
      selected_color:
        item.selectedColor === undefined || item.selectedColor === null
          ? null
          : String(item.selectedColor),
      selected_size:
        item.selectedSize === undefined || item.selectedSize === null
          ? null
          : String(item.selectedSize)
    };
  });
  const total = Number(
    orderItems
      .reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
      .toFixed(2)
  );

  const order = await sequelize.transaction(async (transaction) => {
    const createdOrder = await Order.create(
      { user_id: request.userId, total },
      { transaction }
    );
    await OrderItem.bulkCreate(
      orderItems.map((item) => ({ ...item, order_id: createdOrder.id })),
      { transaction }
    );
    return Order.findByPk(createdOrder.id, {
      include: [{ model: OrderItem, as: "items" }],
      transaction
    });
  });

  return response.status(201).json(serializeOrder(order));
}

module.exports = { list, create };
