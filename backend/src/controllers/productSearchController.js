const { Op } = require("sequelize");
const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");
const ProductOption = require("../models/ProductOption");
const Category = require("../models/Category");
const ProductCategory = require("../models/ProductCategory");

const responseFields = [
  "id",
  "enabled",
  "name",
  "slug",
  "stock",
  "description",
  "price",
  "price_with_discount",
  "category_ids",
  "images",
  "options"
];
const allowedFields = new Set(responseFields);

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

function parseIdList(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: field };
  }

  const ids = value.split(",").map((item) => parseInteger(item.trim(), field, 1));
  if (ids.some((item) => item.error)) {
    return { error: field };
  }

  return { value: [...new Set(ids.map((item) => item.value))] };
}

function parseOptionFilters(query) {
  const filters = [];

  for (const [key, value] of Object.entries(query)) {
    if (!key.startsWith("option")) {
      continue;
    }

    const match = key.match(/^option\[(\d+)\]$/);
    if (!match) {
      if (key !== "option" || !value || typeof value !== "object" || Array.isArray(value)) {
        return { error: "option" };
      }

      for (const [optionId, optionValue] of Object.entries(value)) {
        const parsedId = parseInteger(optionId, "option", 1);
        const parsedValues = parseIdOrStringList(optionValue, "option");
        if (parsedId.error || parsedValues.error) {
          return { error: "option" };
        }
        filters.push({ id: parsedId.value, values: parsedValues.value });
      }
      continue;
    }

    const parsedId = parseInteger(match[1], "option", 1);
    const parsedValues = parseIdOrStringList(value, "option");
    if (parsedId.error || parsedValues.error) {
      return { error: "option" };
    }
    filters.push({ id: parsedId.value, values: parsedValues.value });
  }

  return { value: filters };
}

function parseIdOrStringList(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: field };
  }

  const values = value.split(",").map((item) => item.trim());
  if (values.some((item) => item === "")) {
    return { error: field };
  }

  return { value: [...new Set(values)] };
}

function selectedFields(query) {
  if (query.fields === undefined) {
    return { value: responseFields };
  }
  if (typeof query.fields !== "string" || query.fields.trim() === "") {
    return { error: "fields" };
  }

  const fields = [...new Set(query.fields.split(",").map((field) => field.trim()))];
  if (fields.some((field) => !allowedFields.has(field))) {
    return { error: "fields" };
  }

  return { value: fields };
}

function productIncludes() {
  return [
    {
      model: ProductImage,
      as: "images",
      attributes: ["id", "path"],
      required: false
    },
    {
      model: ProductOption,
      as: "options",
      attributes: ["id", "title", "shape", "radius", "type", "values"],
      required: false
    },
    {
      model: Category,
      as: "categories",
      attributes: ["id"],
      through: { attributes: [] },
      required: false
    }
  ];
}

function serializeProduct(product, fields = responseFields) {
  const plainProduct = product.get({ plain: true });
  const result = {
    id: plainProduct.id,
    enabled: plainProduct.enabled,
    name: plainProduct.name,
    slug: plainProduct.slug,
    stock: plainProduct.stock,
    description: plainProduct.description,
    price: plainProduct.price,
    price_with_discount: plainProduct.price_with_discount,
    category_ids: plainProduct.categories
      .map((category) => category.id)
      .sort((left, right) => left - right),
    images: plainProduct.images
      .slice()
      .sort((left, right) => left.id - right.id)
      .map(({ id, path }) => ({
        id,
        content: /^(?:https?:)?\/\//i.test(path) || path.startsWith("/")
          ? path
          : `/media/${path.replace(/\\/g, "/")}`
      })),
    options: plainProduct.options
      .slice()
      .sort((left, right) => left.id - right.id)
  };

  return Object.fromEntries(
    fields
      .filter((field) => Object.hasOwn(result, field))
      .map((field) => [field, result[field]])
  );
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

  const fields = selectedFields(query);
  if (fields.error) {
    return invalidQuery(response, [fields.error]);
  }

  let match;
  if (query.match !== undefined) {
    if (typeof query.match !== "string" || query.match.trim() === "") {
      return invalidQuery(response, ["match"]);
    }
    match = query.match.trim();
  }

  let categoryIds;
  if (query.category_ids !== undefined) {
    const parsedCategoryIds = parseIdList(query.category_ids, "category_ids");
    if (parsedCategoryIds.error) {
      return invalidQuery(response, [parsedCategoryIds.error]);
    }
    categoryIds = parsedCategoryIds.value;
  }

  let priceRange;
  if (query["price-range"] !== undefined) {
    const range = query["price-range"];
    const rangeMatch =
      typeof range === "string" &&
      range.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
    if (!rangeMatch) {
      return invalidQuery(response, ["price-range"]);
    }

    const minimum = Number(rangeMatch[1]);
    const maximum = Number(rangeMatch[2]);
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum > maximum) {
      return invalidQuery(response, ["price-range"]);
    }
    priceRange = { minimum, maximum };
  }

  const optionFilters = parseOptionFilters(query);
  if (optionFilters.error) {
    return invalidQuery(response, [optionFilters.error]);
  }

  const where = {};
  if (match !== undefined) {
    where[Op.or] = [
      { name: { [Op.like]: `%${match}%` } },
      { description: { [Op.like]: `%${match}%` } }
    ];
  }
  if (priceRange) {
    where.price = { [Op.between]: [priceRange.minimum, priceRange.maximum] };
  }

  let matchingProductIds;
  function restrictToProductIds(productIds) {
    const nextIds = new Set(productIds);
    matchingProductIds =
      matchingProductIds === undefined
        ? nextIds
        : new Set([...matchingProductIds].filter((id) => nextIds.has(id)));
  }

  if (categoryIds) {
    const links = await ProductCategory.findAll({
      attributes: ["product_id"],
      where: { category_id: { [Op.in]: categoryIds } },
      raw: true
    });
    restrictToProductIds(links.map((link) => link.product_id));
  }

  for (const filter of optionFilters.value) {
    const optionRows = await ProductOption.findAll({
      attributes: ["product_id", "values"],
      where: { id: filter.id },
      raw: true
    });
    const productIds = optionRows
      .filter((option) =>
        option.values
          .split(",")
          .some((value) => filter.values.includes(value.trim()))
      )
      .map((option) => option.product_id);
    restrictToProductIds(productIds);
  }

  if (matchingProductIds !== undefined) {
    where.id = { [Op.in]: [...matchingProductIds] };
  }

  const options = {
    where,
    include: productIncludes(),
    order: [["id", "ASC"]],
    distinct: true
  };
  if (limit !== -1) {
    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(offset)) {
      return invalidQuery(response, ["page"]);
    }
    options.limit = limit;
    options.offset = offset;
  }

  const { count, rows } = await Product.findAndCountAll(options);
  const data = rows.map((product) => serializeProduct(product, fields.value));

  return response.json({ data, total: count, limit, page });
}

async function getById(request, response) {
  const id = Number(request.params.id);
  const product =
    Number.isInteger(id) && id > 0
      ? await Product.findByPk(id, { include: productIncludes() })
      : null;

  if (!product) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  return response.json(serializeProduct(product));
}

module.exports = { search, getById, productIncludes, serializeProduct };
