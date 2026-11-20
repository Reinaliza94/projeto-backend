const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { QueryTypes } = require("sequelize");

const databaseDirectory = mkdtempSync(path.join(os.tmpdir(), "drip-store-option-test-"));
process.env.DATABASE_PATH = path.join(databaseDirectory, "options.sqlite");

const sequelize = require("../src/config/sequelize");
const Product = require("../src/models/Product");
const ProductOption = require("../src/models/ProductOption");

after(async () => {
  await sequelize.close();
  delete process.env.DATABASE_PATH;
  rmSync(databaseDirectory, { recursive: true, force: true });
});

test("product options enforce their enums, defaults, and product foreign key", async () => {
  await sequelize.sync();

  const product = await Product.create({
    name: "Tênis",
    slug: "tenis",
    price: 299.9,
    price_with_discount: 249.9
  });
  const defaultOption = await ProductOption.create({
    product_id: product.id,
    title: "Tamanho",
    values: "38,39,40"
  });
  const colorOption = await ProductOption.create({
    product_id: product.id,
    title: "Cor",
    shape: "circle",
    radius: 8,
    type: "color",
    values: "preto,branco"
  });

  assert.ok(defaultOption.id > 0);
  assert.equal(defaultOption.shape, "square");
  assert.equal(defaultOption.radius, 0);
  assert.equal(defaultOption.type, "text");
  assert.equal(colorOption.shape, "circle");
  assert.equal(colorOption.type, "color");

  const columns = await sequelize.getQueryInterface().describeTable("product_options");
  assert.deepEqual(
    Object.keys(columns).sort(),
    ["id", "product_id", "title", "shape", "radius", "type", "values"].sort()
  );
  for (const column of ["product_id", "title", "values"]) {
    assert.equal(columns[column].allowNull, false);
  }
  for (const column of ["shape", "radius", "type"]) {
    assert.equal(columns[column].allowNull, true);
  }

  const foreignKeys = await sequelize.query(
    "PRAGMA foreign_key_list(product_options)",
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

  await assert.rejects(
    ProductOption.create({
      product_id: product.id,
      title: "Formato inválido",
      shape: "triangle",
      values: "x"
    })
  );
  await assert.rejects(
    ProductOption.create({
      product_id: product.id,
      title: "Tipo inválido",
      type: "number",
      values: "x"
    })
  );
  await assert.rejects(
    ProductOption.create({
      product_id: 999,
      title: "Opção órfã",
      values: "x"
    }),
    { name: "SequelizeForeignKeyConstraintError" }
  );

  const productWithOptions = await Product.findByPk(product.id, {
    include: [{ model: ProductOption, as: "options" }]
  });
  assert.equal(productWithOptions.options.length, 2);
});
