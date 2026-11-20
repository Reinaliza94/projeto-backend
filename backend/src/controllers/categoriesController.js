const Category = require("../models/Category");

const allowedFields = new Set(["id", "name", "slug", "use_in_menu"]);

function invalidQuery(response, fields) {
  return response.status(400).json({
    error: "Parâmetros de busca inválidos",
    fields
  });
}

function parseInteger(value, field, minimum) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return { error: field };
  }

  const parsedValue = Number(value);
  if (!Number.isSafeInteger(parsedValue) || parsedValue < minimum) {
    return { error: field };
  }

  return { value: parsedValue };
}

async function search(request, response) {
  const query = request.query;
  let limit = 12;

  if (query.limit !== undefined) {
    if (query.limit === "-1") {
      limit = -1;
    } else {
      const parsedLimit = parseInteger(query.limit, "limit", 1);
      if (parsedLimit.error) {
        return invalidQuery(response, [parsedLimit.error]);
      }
      limit = parsedLimit.value;
    }
  }

  let page = 1;
  if (query.page !== undefined) {
    const parsedPage = parseInteger(query.page, "page", 1);
    if (parsedPage.error) {
      return invalidQuery(response, [parsedPage.error]);
    }
    page = parsedPage.value;
  }

  let attributes;
  if (query.fields !== undefined) {
    if (typeof query.fields !== "string" || query.fields.trim() === "") {
      return invalidQuery(response, ["fields"]);
    }

    attributes = [...new Set(query.fields.split(",").map((field) => field.trim()))];
    if (
      attributes.some(
        (field) => field === "" || !allowedFields.has(field)
      )
    ) {
      return invalidQuery(response, ["fields"]);
    }
  }

  const where = {};
  if (query.use_in_menu !== undefined) {
    if (query.use_in_menu === "true") {
      where.use_in_menu = true;
    } else if (query.use_in_menu === "false") {
      where.use_in_menu = false;
    } else {
      return invalidQuery(response, ["use_in_menu"]);
    }
  }

  const options = {
    where,
    order: [["id", "ASC"]]
  };
  if (attributes) {
    options.attributes = attributes;
  }
  if (limit !== -1) {
    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(offset)) {
      return invalidQuery(response, ["page"]);
    }
    options.limit = limit;
    options.offset = offset;
  }

  const { count, rows } = await Category.findAndCountAll(options);
  return response.json({
    data: rows,
    total: count,
    limit,
    page
  });
}

async function getById(request, response) {
  const id = Number(request.params.id);
  const category =
    Number.isInteger(id) && id > 0
      ? await Category.findByPk(id, {
          attributes: ["id", "name", "slug", "use_in_menu"]
        })
      : null;

  if (!category) {
    return response.status(404).json({ error: "Categoria não encontrada" });
  }

  return response.json(category);
}

function invalidCategoryFields(category) {
  if (!category || typeof category !== "object" || Array.isArray(category)) {
    return ["body"];
  }

  const invalidFields = ["name", "slug"].filter(
    (field) =>
      typeof category[field] !== "string" || category[field].trim() === ""
  );

  if (
    category.use_in_menu !== undefined &&
    typeof category.use_in_menu !== "boolean"
  ) {
    invalidFields.push("use_in_menu");
  }

  return invalidFields;
}

async function create(request, response) {
  const invalidFields = invalidCategoryFields(request.body);
  if (invalidFields.length > 0) {
    return response.status(400).json({
      error: "Dados da categoria inválidos",
      fields: invalidFields
    });
  }

  const { name, slug } = request.body;
  const use_in_menu =
    request.body.use_in_menu === undefined ? false : request.body.use_in_menu;
  const category = await Category.create({ name, slug, use_in_menu });

  return response
    .status(201)
    .location(`/v1/category/${category.id}`)
    .json({
      id: category.id,
      name: category.name,
      slug: category.slug,
      use_in_menu: category.use_in_menu
    });
}

async function update(request, response) {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(404).json({ error: "Categoria não encontrada" });
  }

  const category = await Category.findByPk(id);
  if (!category) {
    return response.status(404).json({ error: "Categoria não encontrada" });
  }

  const invalidFields = invalidCategoryFields(request.body);
  if (invalidFields.length > 0) {
    return response.status(400).json({
      error: "Dados da categoria inválidos",
      fields: invalidFields
    });
  }

  const { name, slug } = request.body;
  const use_in_menu =
    request.body.use_in_menu === undefined ? false : request.body.use_in_menu;
  await category.update({ name, slug, use_in_menu });
  return response.status(204).end();
}

async function remove(request, response) {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(404).json({ error: "Categoria não encontrada" });
  }

  const deletedCategories = await Category.destroy({ where: { id } });
  if (deletedCategories === 0) {
    return response.status(404).json({ error: "Categoria não encontrada" });
  }

  return response.status(204).end();
}

module.exports = { search, getById, create, update, remove };
