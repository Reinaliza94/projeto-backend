const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const jwt = require("jsonwebtoken");
const { once } = require("node:events");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const databaseDirectory = mkdtempSync(path.join(os.tmpdir(), "drip-store-orders-test-"));
process.env.DATABASE_PATH = path.join(databaseDirectory, "orders.sqlite");
process.env.JWT_SECRET = "test-secret-for-orders-api";

const sequelize = require("../src/config/sequelize");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const ProductImage = require("../src/models/ProductImage");
const app = require("../src/app");

let server;
let baseUrl;

before(async () => {
  await sequelize.sync();
  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve) => server.close(resolve));
  }

  await sequelize.close();
  delete process.env.DATABASE_PATH;
  delete process.env.JWT_SECRET;
  rmSync(databaseDirectory, { recursive: true, force: true });
});

test("authenticated orders save cart items and only return the owner's history", async () => {
  const [user, otherUser] = await Promise.all([
    User.create({
      firstname: "Ana",
      surname: "Silva",
      email: "ana.orders@example.com",
      password: "senha-segura"
    }),
    User.create({
      firstname: "João",
      surname: "Souza",
      email: "joao.orders@example.com",
      password: "senha-segura"
    })
  ]);
  const product = await Product.create({
    enabled: true,
    name: "Tênis de corrida",
    slug: "tenis-de-corrida",
    price: 100,
    price_with_discount: 75.5
  });
  await ProductImage.create({
    product_id: product.id,
    path: "uploads/tenis.png"
  });
  const token = jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET);
  const otherToken = jwt.sign(
    { sub: String(otherUser.id) },
    process.env.JWT_SECRET
  );

  const unauthenticatedResponse = await fetch(`${baseUrl}/v1/order`);
  assert.equal(unauthenticatedResponse.status, 400);

  const invalidOrderResponse = await fetch(`${baseUrl}/v1/order`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ items: [{ productId: 999, quantity: 1 }] })
  });
  assert.equal(invalidOrderResponse.status, 400);

  const createResponse = await fetch(`${baseUrl}/v1/order`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      items: [
        {
          productId: product.id,
          quantity: 2,
          selectedColor: "Preto",
          selectedSize: "M",
          priceDiscount: 0,
          name: "Preço enviado pelo cliente"
        }
      ]
    })
  });
  assert.equal(createResponse.status, 201);
  const createdOrder = await createResponse.json();
  assert.equal(createdOrder.total, 151);
  assert.equal(createdOrder.items[0].name, "Tênis de corrida");
  assert.equal(createdOrder.items[0].priceDiscount, 75.5);
  assert.equal(createdOrder.items[0].quantity, 2);
  assert.equal(createdOrder.items[0].selectedColor, "Preto");
  assert.equal(createdOrder.items[0].selectedSize, "M");
  assert.equal(createdOrder.items[0].image, "/media/uploads/tenis.png");

  await Product.destroy({ where: { id: product.id } });

  const historyResponse = await fetch(`${baseUrl}/v1/order`, {
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(historyResponse.status, 200);
  const history = await historyResponse.json();
  assert.equal(history.length, 1);
  assert.equal(history[0].id, createdOrder.id);
  assert.equal(history[0].items[0].name, "Tênis de corrida");
  assert.equal(history[0].items[0].priceDiscount, 75.5);
  assert.equal(history[0].items[0].productId, null);

  const otherHistoryResponse = await fetch(`${baseUrl}/v1/order`, {
    headers: { authorization: `Bearer ${otherToken}` }
  });
  assert.equal(otherHistoryResponse.status, 200);
  assert.deepEqual(await otherHistoryResponse.json(), []);
});
