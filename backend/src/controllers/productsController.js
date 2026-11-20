const Product = require("../models/Product");
const requiredStringFields = ["name", "slug"];

function invalidProductFields(product) {
  if (!product || typeof product !== "object" || Array.isArray(product)) {
    return ["body"];
  }

  const invalidFields = requiredStringFields.filter(
    (field) => typeof product[field] !== "string" || product[field].trim() === ""
  );

  for (const field of ["enabled", "use_in_menu"]) {
    if (
      product[field] !== undefined &&
      product[field] !== null &&
      typeof product[field] !== "boolean"
    ) {
      invalidFields.push(field);
    }
  }

  if (
    product.stock !== undefined &&
    product.stock !== null &&
    (!Number.isInteger(product.stock) || product.stock < 0)
  ) {
    invalidFields.push("stock");
  }

  if (
    product.description !== undefined &&
    product.description !== null &&
    typeof product.description !== "string"
  ) {
    invalidFields.push("description");
  }

  for (const field of ["price", "price_with_discount"]) {
    if (
      typeof product[field] !== "number" ||
      !Number.isFinite(product[field]) ||
      product[field] < 0
    ) {
      invalidFields.push(field);
    }
  }

  return invalidFields;
}

function productValues(product) {
  return {
    enabled: product.enabled === undefined ? false : product.enabled,
    name: product.name,
    slug: product.slug,
    use_in_menu: product.use_in_menu === undefined ? false : product.use_in_menu,
    stock: product.stock === undefined ? 0 : product.stock,
    description: product.description === undefined ? null : product.description,
    price: product.price,
    price_with_discount: product.price_with_discount
  };
}

function respondWithInvalidProduct(response, fields) {
  return response.status(400).json({
    error: "Dados do produto inválidos",
    fields
  });
}

async function list(request, response) {
  const products = await Product.findAll({ order: [["id", "ASC"]] });
  return response.json(products);
}

async function getById(request, response) {
  const id = Number(request.params.id);
  const product =
    Number.isInteger(id) && id > 0 ? await Product.findByPk(id) : null;

  if (!product) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  return response.json(product);
}

async function create(request, response) {
  const invalidFields = invalidProductFields(request.body);

  if (invalidFields.length > 0) {
    return respondWithInvalidProduct(response, invalidFields);
  }

  const product = await Product.create(productValues(request.body));
  return response
    .status(201)
    .location(`/api/products/${product.id}`)
    .json(product);
}

async function update(request, response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  const product = await Product.findByPk(id);
  if (!product) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  const invalidFields = invalidProductFields(request.body);
  if (invalidFields.length > 0) {
    return respondWithInvalidProduct(response, invalidFields);
  }

  await product.update(productValues(request.body));
  return response.status(204).end();
}

async function remove(request, response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  const deletedProducts = await Product.destroy({ where: { id } });
  if (deletedProducts === 0) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  return response.status(204).end();
}

module.exports = { list, getById, create, update, remove };
