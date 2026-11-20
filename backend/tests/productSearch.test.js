const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const jwt = require("jsonwebtoken");
const { once } = require("node:events");
const { existsSync, mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const databaseDirectory = mkdtempSync(path.join(os.tmpdir(), "drip-store-product-search-test-"));
process.env.DATABASE_PATH = path.join(databaseDirectory, "products.sqlite");
process.env.MEDIA_PATH = path.join(databaseDirectory, "media");
process.env.JWT_SECRET = "test-secret-for-product-api";

const sequelize = require("../src/config/sequelize");
const Product = require("../src/models/Product");
const ProductImage = require("../src/models/ProductImage");
const ProductOption = require("../src/models/ProductOption");
const Category = require("../src/models/Category");
const ProductCategory = require("../src/models/ProductCategory");
const app = require("../src/app");

let server;
let baseUrl;
let productIds;
let categoryIds;
let sizeOptionId;
let createdProductId;
let createdImageIds;
let createdOptionIds;

before(async () => {
  await sequelize.sync();
  const [shoes, bags] = await Promise.all([
    Category.create({ name: "Shoes", slug: "shoes" }),
    Category.create({ name: "Bags", slug: "bags" })
  ]);
  categoryIds = { shoes: shoes.id, bags: bags.id };

  const [runningShoe, casualShoe, backpack] = await Promise.all([
    Product.create({
      enabled: true,
      name: "Tênis Road",
      slug: "tenis-road",
      stock: 10,
      description: "Ideal para corrida",
      price: 150,
      price_with_discount: 120
    }),
    Product.create({
      name: "Tênis Casual",
      slug: "tenis-casual",
      stock: 5,
      description: "Calçado confortável",
      price: 250,
      price_with_discount: 200
    }),
    Product.create({
      name: "Mochila",
      slug: "mochila",
      stock: 8,
      description: "Acessório para trilha",
      price: 100,
      price_with_discount: 90
    })
  ]);
  productIds = {
    runningShoe: runningShoe.id,
    casualShoe: casualShoe.id,
    backpack: backpack.id
  };

  await ProductCategory.bulkCreate([
    { product_id: runningShoe.id, category_id: shoes.id },
    { product_id: runningShoe.id, category_id: bags.id },
    { product_id: casualShoe.id, category_id: shoes.id },
    { product_id: backpack.id, category_id: bags.id }
  ]);

  await ProductImage.create({
    product_id: runningShoe.id,
    enabled: true,
    path: "https://store.com/media/tenis-road.png"
  });
  const sizeOption = await ProductOption.create({
    product_id: runningShoe.id,
    title: "Tamanho",
    values: "P, M, GG"
  });
  sizeOptionId = sizeOption.id;
  await ProductOption.create({
    product_id: casualShoe.id,
    title: "Cor",
    type: "color",
    values: "Azul, Preto"
  });

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
  delete process.env.MEDIA_PATH;
  delete process.env.JWT_SECRET;
  rmSync(databaseDirectory, { recursive: true, force: true });
});

test("GET /v1/product/search returns shaped data, relationships, and pagination", async () => {
  const response = await fetch(`${baseUrl}/v1/product/search`);
  assert.equal(response.status, 200);
  const result = await response.json();

  assert.equal(result.total, 3);
  assert.equal(result.limit, 12);
  assert.equal(result.page, 1);
  assert.equal(result.data.length, 3);
  assert.deepEqual(result.data[0], {
    id: productIds.runningShoe,
    enabled: true,
    name: "Tênis Road",
    slug: "tenis-road",
    stock: 10,
    description: "Ideal para corrida",
    price: 150,
    price_with_discount: 120,
    category_ids: [categoryIds.shoes, categoryIds.bags],
    images: [
      {
        id: result.data[0].images[0].id,
        content: "https://store.com/media/tenis-road.png"
      }
    ],
    options: [
      {
        id: sizeOptionId,
        title: "Tamanho",
        shape: "square",
        radius: 0,
        type: "text",
        values: "P, M, GG"
      }
    ]
  });

  const allResponse = await fetch(
    `${baseUrl}/v1/product/search?limit=-1&page=2`
  );
  const allResult = await allResponse.json();
  assert.equal(allResult.total, 3);
  assert.equal(allResult.limit, -1);
  assert.equal(allResult.page, 2);
  assert.equal(allResult.data.length, 3);

  const pageResponse = await fetch(
    `${baseUrl}/v1/product/search?limit=1&page=2`
  );
  const pageResult = await pageResponse.json();
  assert.equal(pageResult.total, 3);
  assert.equal(pageResult.limit, 1);
  assert.equal(pageResult.page, 2);
  assert.equal(pageResult.data[0].id, productIds.casualShoe);

  const selectedFieldsResponse = await fetch(
    `${baseUrl}/v1/product/search?fields=name,images,price`
  );
  const selectedFieldsResult = await selectedFieldsResponse.json();
  assert.deepEqual(Object.keys(selectedFieldsResult.data[0]).sort(), [
    "images",
    "name",
    "price"
  ]);
});

test("GET /v1/product/search applies match, category, price, and option filters", async () => {
  const matchResponse = await fetch(
    `${baseUrl}/v1/product/search?match=corrida`
  );
  const matchResult = await matchResponse.json();
  assert.equal(matchResult.total, 1);
  assert.equal(matchResult.data[0].id, productIds.runningShoe);

  const categoryResponse = await fetch(
    `${baseUrl}/v1/product/search?category_ids=${categoryIds.bags}`
  );
  const categoryResult = await categoryResponse.json();
  assert.equal(categoryResult.total, 2);
  assert.deepEqual(
    categoryResult.data.map((product) => product.id),
    [productIds.runningShoe, productIds.backpack]
  );

  const priceResponse = await fetch(
    `${baseUrl}/v1/product/search?price-range=100-150`
  );
  const priceResult = await priceResponse.json();
  assert.equal(priceResult.total, 2);
  assert.deepEqual(
    priceResult.data.map((product) => product.id),
    [productIds.runningShoe, productIds.backpack]
  );

  const optionResponse = await fetch(
    `${baseUrl}/v1/product/search?option%5B${sizeOptionId}%5D=GG,PP`
  );
  const optionResult = await optionResponse.json();
  assert.equal(optionResult.total, 1);
  assert.equal(optionResult.data[0].id, productIds.runningShoe);
});

test("GET /v1/product/search returns 400 for invalid search parameters", async () => {
  for (const query of [
    "limit=0",
    "page=0",
    "fields=name,unknown",
    "match=",
    "category_ids=1,invalid",
    "price-range=200-100",
    "option%5B0%5D=GG"
  ]) {
    const response = await fetch(`${baseUrl}/v1/product/search?${query}`);
    assert.equal(response.status, 400, query);
  }
});

test("GET /v1/product/:id returns the product with relationships or 404", async () => {
  const response = await fetch(
    `${baseUrl}/v1/product/${productIds.runningShoe}`
  );
  assert.equal(response.status, 200);
  const product = await response.json();

  assert.equal(product.id, productIds.runningShoe);
  assert.equal(product.name, "Tênis Road");
  assert.deepEqual(product.category_ids, [
    categoryIds.shoes,
    categoryIds.bags
  ].sort((left, right) => left - right));
  assert.deepEqual(product.images, [
    {
      id: product.images[0].id,
      content: "https://store.com/media/tenis-road.png"
    }
  ]);
  assert.equal(product.options[0].id, sizeOptionId);
  assert.equal(product.options[0].values, "P, M, GG");

  const missingResponse = await fetch(`${baseUrl}/v1/product/999`);
  assert.equal(missingResponse.status, 404);

  const invalidIdResponse = await fetch(`${baseUrl}/v1/product/invalid`);
  assert.equal(invalidIdResponse.status, 404);
});

test("POST /v1/product requires a valid JWT and creates related records and images", async () => {
  const imageContent = Buffer.from("sample-png-image").toString("base64");
  const payload = {
    enabled: true,
    name: "Product from API",
    slug: "product-from-api",
    stock: 4,
    description: "Product created through the API",
    price: 180,
    price_with_discount: 150,
    category_ids: [categoryIds.shoes, categoryIds.bags],
    images: [
      { type: "image/png", content: imageContent },
      { type: "image/jpg", content: imageContent }
    ],
    options: [
      {
        title: "Tamanho",
        shape: "circle",
        radius: "4px",
        type: "text",
        value: ["PP", "GG", "M"]
      },
      {
        title: "Cor",
        type: "color",
        values: ["#000", "#333"]
      }
    ]
  };

  const missingTokenResponse = await fetch(`${baseUrl}/v1/product`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  assert.equal(missingTokenResponse.status, 400);

  const invalidTokenResponse = await fetch(`${baseUrl}/v1/product`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer invalid-token"
    },
    body: JSON.stringify(payload)
  });
  assert.equal(invalidTokenResponse.status, 400);

  const token = jwt.sign({ sub: 1 }, process.env.JWT_SECRET);
  const invalidPayloadResponse = await fetch(`${baseUrl}/v1/product`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ ...payload, price: -1 })
  });
  assert.equal(invalidPayloadResponse.status, 400);

  const invalidCategoryResponse = await fetch(`${baseUrl}/v1/product`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ ...payload, category_ids: [999] })
  });
  assert.equal(invalidCategoryResponse.status, 400);

  const createResponse = await fetch(`${baseUrl}/v1/product`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  assert.equal(createResponse.status, 201);
  const createdProduct = await createResponse.json();
  assert.equal(
    createResponse.headers.get("location"),
    `/v1/product/${createdProduct.id}`
  );
  assert.equal(createdProduct.name, payload.name);
  assert.deepEqual(createdProduct.category_ids, [
    categoryIds.shoes,
    categoryIds.bags
  ].sort((left, right) => left - right));
  assert.equal(createdProduct.images.length, 2);
  assert.ok(createdProduct.images[0].content.startsWith("/media/products/"));
  assert.equal(createdProduct.options[0].radius, 4);
  assert.equal(createdProduct.options[0].values, "PP, GG, M");
  assert.equal(createdProduct.options[1].values, "#000, #333");
  createdProductId = createdProduct.id;
  createdImageIds = createdProduct.images.map((image) => image.id);
  createdOptionIds = createdProduct.options.map((option) => option.id);

  const imageResponse = await fetch(
    `${baseUrl}${createdProduct.images[0].content}`
  );
  assert.equal(imageResponse.status, 200);
  assert.equal(
    Buffer.from(await imageResponse.arrayBuffer()).toString("base64"),
    imageContent
  );
});

test("PUT /v1/product/:id requires a valid JWT and updates product relations", async () => {
  const token = jwt.sign({ sub: 1 }, process.env.JWT_SECRET);
  const imageContent = Buffer.from("updated-product-image").toString("base64");
  const payload = {
    enabled: true,
    name: "Product updated through API",
    slug: "product-updated-through-api",
    stock: 20,
    description: "Updated product description",
    price: 49.9,
    price_with_discount: 0,
    category_ids: [categoryIds.bags],
    images: [
      { id: createdImageIds[0], deleted: true },
      {
        id: createdImageIds[1],
        type: "image/png",
        content: imageContent
      },
      { type: "image/png", content: imageContent }
    ],
    options: [
      { id: createdOptionIds[0], deleted: true },
      {
        id: createdOptionIds[1],
        radius: "10px",
        value: ["42/43", "44/45"]
      },
      {
        title: "Tipo",
        shape: "square",
        type: "text",
        values: ["100% algodão", "65% algodão"]
      }
    ]
  };

  const missingTokenResponse = await fetch(
    `${baseUrl}/v1/product/${createdProductId}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }
  );
  assert.equal(missingTokenResponse.status, 400);

  const invalidTokenResponse = await fetch(
    `${baseUrl}/v1/product/${createdProductId}`,
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

  const invalidPayloadResponse = await fetch(
    `${baseUrl}/v1/product/${createdProductId}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...payload, price: -1 })
    }
  );
  assert.equal(invalidPayloadResponse.status, 400);

  const missingProductResponse = await fetch(`${baseUrl}/v1/product/999`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  assert.equal(missingProductResponse.status, 404);

  const invalidImageIdResponse = await fetch(
    `${baseUrl}/v1/product/${createdProductId}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...payload,
        images: [{ id: 999, deleted: true }]
      })
    }
  );
  assert.equal(invalidImageIdResponse.status, 400);

  const invalidOptionIdResponse = await fetch(
    `${baseUrl}/v1/product/${createdProductId}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...payload,
        options: [{ id: 999, deleted: true }]
      })
    }
  );
  assert.equal(invalidOptionIdResponse.status, 400);

  const imageRows = await ProductImage.findAll({
    where: { product_id: createdProductId },
    order: [["id", "ASC"]]
  });
  const oldManagedPaths = imageRows.map((image) => image.path);

  const updateResponse = await fetch(
    `${baseUrl}/v1/product/${createdProductId}`,
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

  const updatedProduct = await Product.findByPk(createdProductId);
  assert.equal(updatedProduct.name, payload.name);
  assert.equal(updatedProduct.price, payload.price);
  assert.equal(updatedProduct.price_with_discount, 0);
  assert.deepEqual(
    (await ProductCategory.findAll({
      where: { product_id: createdProductId },
      order: [["category_id", "ASC"]]
    })).map((relation) => relation.category_id),
    [categoryIds.bags]
  );

  const remainingImages = await ProductImage.findAll({
    where: { product_id: createdProductId },
    order: [["id", "ASC"]]
  });
  assert.equal(remainingImages.length, 2);
  assert.notEqual(remainingImages[0].id, createdImageIds[0]);
  assert.ok(remainingImages.every((image) => image.path.startsWith("products/")));
  const deletedImagePath = path.join(
    process.env.MEDIA_PATH,
    ...oldManagedPaths[0].split("/")
  );
  const replacedImagePath = path.join(
    process.env.MEDIA_PATH,
    ...oldManagedPaths[1].split("/")
  );
  assert.equal(existsSync(deletedImagePath), false);
  assert.equal(existsSync(replacedImagePath), false);

  const remainingOptions = await ProductOption.findAll({
    where: { product_id: createdProductId },
    order: [["id", "ASC"]]
  });
  assert.equal(remainingOptions.length, 2);
  assert.equal(remainingOptions[0].id, createdOptionIds[1]);
  assert.equal(remainingOptions[0].radius, 10);
  assert.equal(remainingOptions[0].values, "42/43, 44/45");
  assert.equal(remainingOptions[1].title, "Tipo");
  assert.equal(remainingOptions[1].values, "100% algodão, 65% algodão");

  const updatedResponse = await fetch(
    `${baseUrl}/v1/product/${createdProductId}`
  );
  assert.equal(updatedResponse.status, 200);
  const updatedProductResponse = await updatedResponse.json();
  assert.equal(updatedProductResponse.images.length, 2);
  assert.deepEqual(updatedProductResponse.category_ids, [categoryIds.bags]);
});

test("DELETE /v1/product/:id requires a valid JWT and removes product data and files", async () => {
  const token = jwt.sign({ sub: 1 }, process.env.JWT_SECRET);
  const images = await ProductImage.findAll({
    where: { product_id: createdProductId }
  });
  const managedFiles = images
    .map((image) =>
      path.join(process.env.MEDIA_PATH, ...image.path.split("/"))
    )
    .filter((file) => existsSync(file));
  assert.equal(managedFiles.length, 2);

  const missingTokenResponse = await fetch(
    `${baseUrl}/v1/product/${createdProductId}`,
    {
      method: "DELETE",
      headers: { "content-type": "application/json" }
    }
  );
  assert.equal(missingTokenResponse.status, 400);

  const invalidTokenResponse = await fetch(
    `${baseUrl}/v1/product/${createdProductId}`,
    {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer invalid-token"
      }
    }
  );
  assert.equal(invalidTokenResponse.status, 400);

  const missingProductResponse = await fetch(`${baseUrl}/v1/product/999`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    }
  });
  assert.equal(missingProductResponse.status, 404);

  const deleteResponse = await fetch(
    `${baseUrl}/v1/product/${createdProductId}`,
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
  assert.equal(await Product.findByPk(createdProductId), null);
  assert.equal(await ProductImage.count({ where: { product_id: createdProductId } }), 0);
  assert.equal(await ProductOption.count({ where: { product_id: createdProductId } }), 0);
  assert.equal(await ProductCategory.count({ where: { product_id: createdProductId } }), 0);
  assert.ok(managedFiles.every((file) => !existsSync(file)));
});
