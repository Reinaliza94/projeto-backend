const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalidUserFields(user) {
  if (!user || typeof user !== "object" || Array.isArray(user)) {
    return ["body"];
  }

  const fields = ["firstname", "surname", "email", "password", "confirmPassword"];
  const invalidFields = fields.filter(
    (field) => typeof user[field] !== "string" || user[field].trim() === ""
  );

  if (
    typeof user.email === "string" &&
    user.email.trim() !== "" &&
    !emailPattern.test(user.email.trim())
  ) {
    invalidFields.push("email");
  }

  if (
    typeof user.password === "string" &&
    typeof user.confirmPassword === "string" &&
    user.password !== user.confirmPassword
  ) {
    invalidFields.push("confirmPassword");
  }

  return [...new Set(invalidFields)];
}

function invalidUserUpdateFields(user) {
  if (!user || typeof user !== "object" || Array.isArray(user)) {
    return ["body"];
  }

  const fields = ["firstname", "surname", "email"];
  const invalidFields = fields.filter(
    (field) => typeof user[field] !== "string" || user[field].trim() === ""
  );

  if (
    typeof user.email === "string" &&
    user.email.trim() !== "" &&
    !emailPattern.test(user.email.trim())
  ) {
    invalidFields.push("email");
  }

  return [...new Set(invalidFields)];
}

async function getById(request, response) {
  const id = Number(request.params.id);
  const user =
    Number.isInteger(id) && id > 0
      ? await User.findByPk(id, {
          attributes: ["id", "firstname", "surname", "email"]
        })
      : null;

  if (!user) {
    return response.status(404).json({ error: "Usuário não encontrado" });
  }

  return response.json(user);
}

async function create(request, response) {
  const invalidFields = invalidUserFields(request.body);

  if (invalidFields.length > 0) {
    return response.status(400).json({
      error: "Dados do usuário inválidos",
      fields: invalidFields
    });
  }

  const { firstname, surname, email, password } = request.body;
  const user = await User.create({ firstname, surname, email, password });

  return response
    .status(201)
    .location(`/v1/user/${user.id}`)
    .json({
      id: user.id,
      firstname: user.firstname,
      surname: user.surname,
      email: user.email
    });
}

async function generateToken(request, response) {
  const credentials = request.body;
  if (
    !credentials ||
    typeof credentials !== "object" ||
    Array.isArray(credentials) ||
    typeof credentials.email !== "string" ||
    !emailPattern.test(credentials.email.trim()) ||
    typeof credentials.password !== "string" ||
    credentials.password.length === 0
  ) {
    return response.status(400).json({
      error: "E-mail ou senha inválidos"
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return response.status(500).json({ error: "Autenticação não configurada" });
  }

  const user = await User.findOne({
    where: { email: credentials.email.trim() }
  });
  if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
    return response.status(400).json({
      error: "E-mail ou senha inválidos"
    });
  }

  const token = jwt.sign(
    { sub: String(user.id) },
    secret,
    { algorithm: "HS256" }
  );
  return response.json({ token });
}

async function update(request, response) {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(404).json({ error: "Usuário não encontrado" });
  }

  const user = await User.findByPk(id);
  if (!user) {
    return response.status(404).json({ error: "Usuário não encontrado" });
  }

  const invalidFields = invalidUserUpdateFields(request.body);
  if (invalidFields.length > 0) {
    return response.status(400).json({
      error: "Dados do usuário inválidos",
      fields: invalidFields
    });
  }

  const { firstname, surname, email } = request.body;
  await user.update({ firstname, surname, email });
  return response.status(204).end();
}

async function remove(request, response) {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(404).json({ error: "Usuário não encontrado" });
  }

  const deletedUsers = await User.destroy({ where: { id } });
  if (deletedUsers === 0) {
    return response.status(404).json({ error: "Usuário não encontrado" });
  }

  return response.status(204).end();
}

module.exports = { getById, create, generateToken, update, remove };
