const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { once } = require("node:events");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const databaseDirectory = mkdtempSync(path.join(os.tmpdir(), "drip-store-users-api-test-"));
process.env.DATABASE_PATH = path.join(databaseDirectory, "users.sqlite");
process.env.JWT_SECRET = "test-secret-for-user-api";

const sequelize = require("../src/config/sequelize");
const User = require("../src/models/User");
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

test("GET /v1/user/:id returns public user fields or 404", async () => {
  const user = await User.create({
    firstname: "Ana",
    surname: "Silva",
    email: "ana@example.com",
    password: "senha-segura"
  });

  const response = await fetch(`${baseUrl}/v1/user/${user.id}`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: user.id,
    firstname: "Ana",
    surname: "Silva",
    email: "ana@example.com"
  });

  const missingResponse = await fetch(`${baseUrl}/v1/user/999`);
  assert.equal(missingResponse.status, 404);

  const invalidIdResponse = await fetch(`${baseUrl}/v1/user/invalid`);
  assert.equal(invalidIdResponse.status, 404);
});

test("POST /v1/user validates input and stores the password as a hash", async () => {
  const invalidResponse = await fetch(`${baseUrl}/v1/user`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstname: "João",
      surname: "Souza",
      email: "joao@example.com",
      password: "senha-segura",
      confirmPassword: "senha-diferente"
    })
  });
  assert.equal(invalidResponse.status, 400);

  const invalidEmailResponse = await fetch(`${baseUrl}/v1/user`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstname: "João",
      surname: "Souza",
      email: "email-invalido",
      password: "senha-segura",
      confirmPassword: "senha-segura"
    })
  });
  assert.equal(invalidEmailResponse.status, 400);

  const createResponse = await fetch(`${baseUrl}/v1/user`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      firstname: "João",
      surname: "Souza",
      email: "joao@example.com",
      password: "senha-segura",
      confirmPassword: "senha-segura"
    })
  });
  assert.equal(createResponse.status, 201);

  const createdUser = await createResponse.json();
  assert.equal(createResponse.headers.get("location"), `/v1/user/${createdUser.id}`);
  assert.deepEqual(
    Object.keys(createdUser).sort(),
    ["id", "firstname", "surname", "email"].sort()
  );
  assert.equal(createdUser.firstname, "João");
  assert.equal(createdUser.surname, "Souza");
  assert.equal(createdUser.email, "joao@example.com");

  const storedUser = await User.findByPk(createdUser.id);
  assert.notEqual(storedUser.password, "senha-segura");
  assert.equal(await bcrypt.compare("senha-segura", storedUser.password), true);
});

test("POST /v1/user/token validates credentials and returns a verifiable JWT", async () => {
  const missingFieldsResponse = await fetch(`${baseUrl}/v1/user/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "joao@example.com" })
  });
  assert.equal(missingFieldsResponse.status, 400);

  const invalidEmailResponse = await fetch(`${baseUrl}/v1/user/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "invalid-email",
      password: "senha-segura"
    })
  });
  assert.equal(invalidEmailResponse.status, 400);

  const incorrectPasswordResponse = await fetch(`${baseUrl}/v1/user/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "joao@example.com",
      password: "senha-incorreta"
    })
  });
  assert.equal(incorrectPasswordResponse.status, 400);

  const response = await fetch(`${baseUrl}/v1/user/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "joao@example.com",
      password: "senha-segura"
    })
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(Object.keys(body), ["token"]);

  const decodedToken = jwt.verify(body.token, process.env.JWT_SECRET, {
    algorithms: ["HS256"]
  });
  const user = await User.findOne({ where: { email: "joao@example.com" } });
  assert.equal(decodedToken.sub, String(user.id));
});

test("PUT /v1/user/:id requires a valid JWT and updates user fields", async () => {
  const user = await User.create({
    firstname: "Maria",
    surname: "Costa",
    email: "maria@example.com",
    password: "senha-segura"
  });
  const payload = {
    firstname: "Maria",
    surname: "Costa Atualizada",
    email: "maria.atualizada@example.com"
  };

  const missingTokenResponse = await fetch(`${baseUrl}/v1/user/${user.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  assert.equal(missingTokenResponse.status, 400);

  const invalidTokenResponse = await fetch(`${baseUrl}/v1/user/${user.id}`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer invalid-token"
    },
    body: JSON.stringify(payload)
  });
  assert.equal(invalidTokenResponse.status, 400);

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
  const invalidBodyResponse = await fetch(`${baseUrl}/v1/user/${user.id}`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ firstname: "Maria" })
  });
  assert.equal(invalidBodyResponse.status, 400);

  const missingUserResponse = await fetch(`${baseUrl}/v1/user/999`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  assert.equal(missingUserResponse.status, 404);

  const updateResponse = await fetch(`${baseUrl}/v1/user/${user.id}`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  assert.equal(updateResponse.status, 204);
  assert.equal(await updateResponse.text(), "");

  const updatedUser = await User.findByPk(user.id);
  assert.equal(updatedUser.firstname, payload.firstname);
  assert.equal(updatedUser.surname, payload.surname);
  assert.equal(updatedUser.email, payload.email);
  assert.equal(await bcrypt.compare("senha-segura", updatedUser.password), true);
});

test("DELETE /v1/user/:id requires a valid JWT and removes the user", async () => {
  const user = await User.create({
    firstname: "Pedro",
    surname: "Lima",
    email: "pedro@example.com",
    password: "senha-segura"
  });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);

  const missingTokenResponse = await fetch(`${baseUrl}/v1/user/${user.id}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" }
  });
  assert.equal(missingTokenResponse.status, 400);

  const invalidTokenResponse = await fetch(`${baseUrl}/v1/user/${user.id}`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer invalid-token"
    }
  });
  assert.equal(invalidTokenResponse.status, 400);

  const missingUserResponse = await fetch(`${baseUrl}/v1/user/999`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    }
  });
  assert.equal(missingUserResponse.status, 404);

  const deleteResponse = await fetch(`${baseUrl}/v1/user/${user.id}`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    }
  });
  assert.equal(deleteResponse.status, 204);
  assert.equal(await deleteResponse.text(), "");
  assert.equal(await User.findByPk(user.id), null);
});
