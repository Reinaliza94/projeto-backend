const assert = require("node:assert/strict");
const { after, test } = require("node:test");
const bcrypt = require("bcrypt");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const databaseDirectory = mkdtempSync(path.join(os.tmpdir(), "drip-store-user-test-"));
process.env.DATABASE_PATH = path.join(databaseDirectory, "users.sqlite");

const sequelize = require("../src/config/sequelize");
const User = require("../src/models/User");

after(async () => {
  await sequelize.close();
  delete process.env.DATABASE_PATH;
  rmSync(databaseDirectory, { recursive: true, force: true });
});

test("users table has required columns, timestamps, and a bcrypt password hash", async () => {
  await sequelize.sync();

  const user = await User.create({
    firstname: "Ana",
    surname: "Silva",
    email: "ana@example.com",
    password: "senha-segura"
  });

  assert.ok(user.id > 0);
  assert.ok(user.createdAt instanceof Date);
  assert.ok(user.updatedAt instanceof Date);
  assert.notEqual(user.password, "senha-segura");
  assert.equal(await bcrypt.compare("senha-segura", user.password), true);

  const columns = await sequelize.getQueryInterface().describeTable("users");
  assert.deepEqual(
    Object.keys(columns).sort(),
    ["id", "firstname", "surname", "email", "password", "created_at", "updated_at"].sort()
  );

  for (const column of ["firstname", "surname", "email", "password"]) {
    assert.equal(columns[column].allowNull, false);
  }
});
