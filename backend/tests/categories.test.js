const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const jwt = require("jsonwebtoken");
const { once } = require("node:events");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const databaseDirectory = mkdtempSync(path.join(os.tmpdir(), "drip-store-categories-api-test-"));
process.env.DATABASE_PATH = path.join(databaseDirectory, "categories.sqlite");
process.env.JWT_SECRET = "test-secret-for-category-api";

const sequelize = require("../src/config/sequelize");
const Category = require("../src/models/Category");
const app = require("../src/app");

let server;
let baseUrl;

before(async () => {
  await sequelize.sync();
  await Category.bulkCreate(
    Array.from({ length: 14 }, (_, index) => ({
      name: `Category ${index + 1}`,
      slug: `category-${index + 1}`,
      use_in_menu: index % 2 === 0
    }))
  );
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

test("GET /v1/category/search supports defaults, pagination, fields, and filtering", async () => {
  const defaultResponse = await fetch(`${baseUrl}/v1/category/search`);
  assert.equal(defaultResponse.status, 200);
  const defaultResult = await defaultResponse.json();
  assert.equal(defaultResult.total, 14);
  assert.equal(defaultResult.limit, 12);
  assert.equal(defaultResult.page, 1);
  assert.equal(defaultResult.data.length, 12);
  assert.equal(defaultResult.data[0].name, "Category 1");

  const pageResponse = await fetch(
    `${baseUrl}/v1/category/search?limit=5&page=2`
  );
  const pageResult = await pageResponse.json();
  assert.equal(pageResult.total, 14);
  assert.equal(pageResult.limit, 5);
  assert.equal(pageResult.page, 2);
  assert.equal(pageResult.data.length, 5);
  assert.equal(pageResult.data[0].name, "Category 6");

  const allResponse = await fetch(
    `${baseUrl}/v1/category/search?limit=-1&page=3&fields=name,slug`
  );
  const allResult = await allResponse.json();
  assert.equal(allResult.total, 14);
  assert.equal(allResult.limit, -1);
  assert.equal(allResult.page, 3);
  assert.equal(allResult.data.length, 14);
  assert.deepEqual(Object.keys(allResult.data[0]).sort(), ["name", "slug"]);

  const menuResponse = await fetch(
    `${baseUrl}/v1/category/search?use_in_menu=true`
  );
  const menuResult = await menuResponse.json();
  assert.equal(menuResult.total, 7);
  assert.ok(menuResult.data.every((category) => category.use_in_menu === true));
});

test("GET /v1/category/search returns 400 for invalid query parameters", async () => {
  for (const query of [
    "limit=0",
    "limit=abc",
    "page=0",
    "fields=name,unknown",
    "use_in_menu=yes"
  ]) {
    const response = await fetch(`${baseUrl}/v1/category/search?${query}`);
    assert.equal(response.status, 400, query);
  }
});

test("GET /v1/category/:id returns the category or 404", async () => {
  const response = await fetch(`${baseUrl}/v1/category/1`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: 1,
    name: "Category 1",
    slug: "category-1",
    use_in_menu: true
  });

  const missingResponse = await fetch(`${baseUrl}/v1/category/999`);
  assert.equal(missingResponse.status, 404);

  const invalidIdResponse = await fetch(`${baseUrl}/v1/category/invalid`);
  assert.equal(invalidIdResponse.status, 404);
});

test("POST /v1/category requires a valid JWT and creates valid categories", async () => {
  const payload = {
    name: "Shoes",
    slug: "shoes",
    use_in_menu: true
  };

  const missingTokenResponse = await fetch(`${baseUrl}/v1/category`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  assert.equal(missingTokenResponse.status, 400);

  const invalidTokenResponse = await fetch(`${baseUrl}/v1/category`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer invalid-token"
    },
    body: JSON.stringify(payload)
  });
  assert.equal(invalidTokenResponse.status, 400);

  const token = jwt.sign({ sub: 1 }, process.env.JWT_SECRET);
  const invalidBodyResponse = await fetch(`${baseUrl}/v1/category`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ ...payload, use_in_menu: "true" })
  });
  assert.equal(invalidBodyResponse.status, 400);

  const createResponse = await fetch(`${baseUrl}/v1/category`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  assert.equal(createResponse.status, 201);
  const createdCategory = await createResponse.json();
  assert.equal(createResponse.headers.get("location"), `/v1/category/${createdCategory.id}`);
  assert.deepEqual(createdCategory, {
    id: createdCategory.id,
    ...payload
  });

  const defaultCategoryResponse = await fetch(`${baseUrl}/v1/category`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name: "Offers", slug: "offers" })
  });
  assert.equal(defaultCategoryResponse.status, 201);
  assert.equal((await defaultCategoryResponse.json()).use_in_menu, false);
});

test("PUT /v1/category/:id requires a valid JWT and updates the category", async () => {
  const category = await Category.findByPk(1);
  const payload = {
    name: "Shoes Updated",
    slug: "shoes-updated",
    use_in_menu: false
  };
  const token = jwt.sign({ sub: 1 }, process.env.JWT_SECRET);

  const missingTokenResponse = await fetch(
    `${baseUrl}/v1/category/${category.id}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }
  );
  assert.equal(missingTokenResponse.status, 400);

  const invalidTokenResponse = await fetch(
    `${baseUrl}/v1/category/${category.id}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer invalid-token"
      },
      body: JSON.stringify(payload)
    }
  );
  assert.equal(invalidTokenResponse.status, 400);

  const invalidBodyResponse = await fetch(
    `${baseUrl}/v1/category/${category.id}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...payload, use_in_menu: "false" })
    }
  );
  assert.equal(invalidBodyResponse.status, 400);

  const missingCategoryResponse = await fetch(`${baseUrl}/v1/category/999`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  assert.equal(missingCategoryResponse.status, 404);

  const updateResponse = await fetch(
    `${baseUrl}/v1/category/${category.id}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }
  );
  assert.equal(updateResponse.status, 204);
  assert.equal(await updateResponse.text(), "");

  const updatedCategory = await Category.findByPk(category.id);
  assert.equal(updatedCategory.name, payload.name);
  assert.equal(updatedCategory.slug, payload.slug);
  assert.equal(updatedCategory.use_in_menu, false);
});

test("DELETE /v1/category/:id requires a valid JWT and removes the category", async () => {
  const category = await Category.create({
    name: "Category to delete",
    slug: "category-to-delete"
  });
  const token = jwt.sign({ sub: 1 }, process.env.JWT_SECRET);

  const missingTokenResponse = await fetch(
    `${baseUrl}/v1/category/${category.id}`,
    {
      method: "DELETE",
      headers: { "content-type": "application/json" }
    }
  );
  assert.equal(missingTokenResponse.status, 400);

  const invalidTokenResponse = await fetch(
    `${baseUrl}/v1/category/${category.id}`,
    {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer invalid-token"
      }
    }
  );
  assert.equal(invalidTokenResponse.status, 400);

  const missingCategoryResponse = await fetch(`${baseUrl}/v1/category/999`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    }
  });
  assert.equal(missingCategoryResponse.status, 404);

  const deleteResponse = await fetch(
    `${baseUrl}/v1/category/${category.id}`,
    {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      }
    }
  );
  assert.equal(deleteResponse.status, 204);
  assert.equal(await deleteResponse.text(), "");
  assert.equal(await Category.findByPk(category.id), null);
});
