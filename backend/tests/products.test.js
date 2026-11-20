const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const jwt = require("jsonwebtoken");
const { once } = require("node:events");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const databaseDirectory = mkdtempSync(path.join(os.tmpdir(), "drip-store-test-"));
process.env.DATABASE_PATH = path.join(databaseDirectory, "test.sqlite");
process.env.JWT_SECRET = "test-secret-for-legacy-products";

const sequelize = require("../src/config/sequelize");
require("../src/models/Product");
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

test("product endpoints use the expected REST status codes", async () => {
  const token = jwt.sign({ sub: "test" }, process.env.JWT_SECRET);
  const authorization = `Bearer ${token}`;
  const listResponse = await fetch(`${baseUrl}/api/products`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), []);

  const missingTokenResponse = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Valid product",
      slug: "valid-product",
      price: 100,
      price_with_discount: 80
    })
  });
  assert.equal(missingTokenResponse.status, 400);

  const invalidProductResponse = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization
    },
    body: JSON.stringify({ name: "Incomplete product" })
  });
  assert.equal(invalidProductResponse.status, 400);

  const newProduct = {
    name: "Produto de teste",
    slug: "produto-de-teste",
    price: 100,
    price_with_discount: 80
  };
  const createResponse = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization
    },
    body: JSON.stringify(newProduct)
  });
  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.headers.get("location"), "/api/products/1");
  const createdProduct = await createResponse.json();
  assert.equal(createdProduct.name, newProduct.name);
  assert.equal(createdProduct.enabled, false);
  assert.equal(createdProduct.use_in_menu, false);
  assert.equal(createdProduct.stock, 0);

  const invalidUpdateResponse = await fetch(
    `${baseUrl}/api/products/${createdProduct.id}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization
      },
      body: JSON.stringify({ name: "Incomplete product" })
    }
  );
  assert.equal(invalidUpdateResponse.status, 400);

  const updateResponse = await fetch(
    `${baseUrl}/api/products/${createdProduct.id}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization
      },
      body: JSON.stringify({
        ...newProduct,
        name: "Produto atualizado",
        use_in_menu: true
      })
    }
  );
  assert.equal(updateResponse.status, 204);
  assert.equal(await updateResponse.text(), "");

  const getResponse = await fetch(
    `${baseUrl}/api/products/${createdProduct.id}`
  );
  assert.equal(getResponse.status, 200);
  const updatedProduct = await getResponse.json();
  assert.equal(updatedProduct.name, "Produto atualizado");
  assert.equal(updatedProduct.use_in_menu, true);

  const missingUpdateResponse = await fetch(`${baseUrl}/api/products/999`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization
    },
    body: JSON.stringify(newProduct)
  });
  assert.equal(missingUpdateResponse.status, 404);

  const deleteResponse = await fetch(
    `${baseUrl}/api/products/${createdProduct.id}`,
    {
      method: "DELETE",
      headers: { authorization }
    }
  );
  assert.equal(deleteResponse.status, 204);
  assert.equal(await deleteResponse.text(), "");

  const missingProductResponse = await fetch(
    `${baseUrl}/api/products/${createdProduct.id}`
  );
  assert.equal(missingProductResponse.status, 404);
});
