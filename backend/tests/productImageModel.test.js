const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { QueryTypes } = require("sequelize");

const databaseDirectory = mkdtempSync(path.join(os.tmpdir(), "drip-store-image-test-"));
process.env.DATABASE_PATH = path.join(databaseDirectory, "images.sqlite");

const sequelize = require("../src/config/sequelize");
const Product = require("../src/models/Product");
const ProductImage = require("../src/models/ProductImage");

after(async () => {
  await sequelize.close();
  delete process.env.DATABASE_PATH;
  rmSync(databaseDirectory, { recursive: true, force: true });
});

test("product images require an existing product and the specified fields", async () => {
  await sequelize.sync();

  const product = await Product.create({
    name: "Tênis",
    slug: "tenis",
    price: 299.9,
    price_with_discount: 249.9
  });
  const image = await ProductImage.create({
    product_id: product.id,
    path: "uploads/products/tenis.png"
  });

  assert.ok(image.id > 0);
  assert.equal(image.product_id, product.id);
  assert.equal(image.enabled, false);

  const columns = await sequelize.getQueryInterface().describeTable("product_images");
  assert.deepEqual(
    Object.keys(columns).sort(),
    ["id", "product_id", "enabled", "path"].sort()
  );
  assert.equal(columns.product_id.allowNull, false);
  assert.equal(columns.enabled.allowNull, true);
  assert.equal(columns.path.allowNull, false);

  const foreignKeys = await sequelize.query(
    "PRAGMA foreign_key_list(product_images)",
    { type: QueryTypes.SELECT }
  );
  assert.ok(
    foreignKeys.some(
      (key) =>
        key.table === "products" &&
        key.from === "product_id" &&
        key.to === "id" &&
        key.on_delete === "CASCADE"
    )
  );

  const productWithImages = await Product.findByPk(product.id, {
    include: [{ model: ProductImage, as: "images" }]
  });
  assert.equal(productWithImages.images[0].path, image.path);

  await assert.rejects(
    ProductImage.create({
      product_id: 999,
      path: "uploads/products/orphan.png"
    }),
    { name: "SequelizeForeignKeyConstraintError" }
  );
});
