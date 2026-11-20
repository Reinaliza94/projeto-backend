const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const databaseDirectory = mkdtempSync(path.join(os.tmpdir(), "drip-store-category-test-"));
process.env.DATABASE_PATH = path.join(databaseDirectory, "categories.sqlite");

const sequelize = require("../src/config/sequelize");
const Category = require("../src/models/Category");

after(async () => {
  await sequelize.close();
  delete process.env.DATABASE_PATH;
  rmSync(databaseDirectory, { recursive: true, force: true });
});

test("categories table has the required fields, default, and timestamps", async () => {
  await sequelize.sync();

  const category = await Category.create({
    name: "Calçados",
    slug: "calcados"
  });
  const menuCategory = await Category.create({
    name: "Roupas",
    slug: "roupas",
    use_in_menu: true
  });

  assert.ok(category.id > 0);
  assert.equal(category.use_in_menu, false);
  assert.equal(menuCategory.use_in_menu, true);
  assert.ok(category.createdAt instanceof Date);
  assert.ok(category.updatedAt instanceof Date);

  const columns = await sequelize.getQueryInterface().describeTable("categories");
  assert.deepEqual(
    Object.keys(columns).sort(),
    ["id", "name", "slug", "use_in_menu", "created_at", "updated_at"].sort()
  );
  assert.equal(columns.name.allowNull, false);
  assert.equal(columns.slug.allowNull, false);
  assert.equal(columns.use_in_menu.allowNull, true);
});
