const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { QueryTypes } = require("sequelize");

const databaseDirectory = mkdtempSync(path.join(os.tmpdir(), "drip-store-product-category-test-"));
process.env.DATABASE_PATH = path.join(databaseDirectory, "product-categories.sqlite");

const sequelize = require("../src/config/sequelize");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");
const ProductCategory = require("../src/models/ProductCategory");

after(async () => {
  await sequelize.close();
  delete process.env.DATABASE_PATH;
  rmSync(databaseDirectory, { recursive: true, force: true });
});

test("product_categories links existing products and categories", async () => {
  await sequelize.sync();

  const product = await Product.create({
    name: "Tênis",
    slug: "tenis",
    price: 299.9,
    price_with_discount: 249.9
  });
  const category = await Category.create({
    name: "Calçados",
    slug: "calcados"
  });

  await product.addCategory(category);

  const link = await ProductCategory.findOne({
    where: { product_id: product.id, category_id: category.id }
  });
  assert.ok(link);

  const columns = await sequelize.getQueryInterface().describeTable("product_categories");
  assert.deepEqual(Object.keys(columns).sort(), ["product_id", "category_id"].sort());
  assert.equal(columns.product_id.allowNull, false);
  assert.equal(columns.category_id.allowNull, false);

  const foreignKeys = await sequelize.query(
    "PRAGMA foreign_key_list(product_categories)",
    { type: QueryTypes.SELECT }
  );
  assert.ok(
    foreignKeys.some(
      (key) =>
        key.table === "products" &&
        key.from === "product_id" &&
        key.to === "id"
    )
  );
  assert.ok(
    foreignKeys.some(
      (key) =>
        key.table === "categories" &&
        key.from === "category_id" &&
        key.to === "id"
    )
  );

  const productWithCategories = await Product.findByPk(product.id, {
    include: [{ model: Category, as: "categories" }]
  });
  assert.equal(productWithCategories.categories[0].id, category.id);

  await assert.rejects(
    ProductCategory.create({
      product_id: 999,
      category_id: category.id
    }),
    { name: "SequelizeForeignKeyConstraintError" }
  );
});
