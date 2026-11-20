const { randomUUID } = require("node:crypto");
const { mkdir, rm, writeFile } = require("node:fs/promises");
const path = require("node:path");
const sequelize = require("../config/sequelize");
const mediaDirectory = require("../config/mediaDirectory");
const Category = require("../models/Category");
const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");
const ProductOption = require("../models/ProductOption");
const ProductCategory = require("../models/ProductCategory");
const { productIncludes, serializeProduct } = require("./productSearchController");

const imageTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"]
]);
const base64Pattern =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function decodeImage(image, index, invalidFields) {
  if (!image || typeof image !== "object" || Array.isArray(image)) {
    invalidFields.push(`images[${index}]`);
    return null;
  }

  const extension = imageTypes.get(image.type);
  if (!extension) {
    invalidFields.push(`images[${index}].type`);
  }
  if (!isNonEmptyString(image.content)) {
    invalidFields.push(`images[${index}].content`);
    return null;
  }

  let encodedContent = image.content;
  const dataUriMatch = encodedContent.match(/^data:(image\/[^;]+);base64,(.*)$/s);
  if (dataUriMatch) {
    if (dataUriMatch[1] !== image.type) {
      invalidFields.push(`images[${index}].type`);
      return null;
    }
    encodedContent = dataUriMatch[2];
  }

  if (!base64Pattern.test(encodedContent)) {
    invalidFields.push(`images[${index}].content`);
    return null;
  }

  const buffer = Buffer.from(encodedContent, "base64");
  if (buffer.length === 0 || buffer.toString("base64") !== encodedContent) {
    invalidFields.push(`images[${index}].content`);
    return null;
  }

  return { buffer, extension };
}

function validateProduct(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { invalidFields: ["body"] };
  }

  const invalidFields = [];
  for (const field of ["name", "slug"]) {
    if (!isNonEmptyString(body[field])) {
      invalidFields.push(field);
    }
  }

  if (
    body.enabled !== undefined &&
    typeof body.enabled !== "boolean"
  ) {
    invalidFields.push("enabled");
  }
  if (
    body.stock !== undefined &&
    (!Number.isInteger(body.stock) || body.stock < 0)
  ) {
    invalidFields.push("stock");
  }
  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    invalidFields.push("description");
  }
  for (const field of ["price", "price_with_discount"]) {
    if (
      typeof body[field] !== "number" ||
      !Number.isFinite(body[field]) ||
      body[field] < 0
    ) {
      invalidFields.push(field);
    }
  }

  const categoryIds = body.category_ids === undefined ? [] : body.category_ids;
  if (
    !Array.isArray(categoryIds) ||
    categoryIds.some(
      (id) => !Number.isSafeInteger(id) || id < 1
    )
  ) {
    invalidFields.push("category_ids");
  }

  const images = body.images === undefined ? [] : body.images;
  const decodedImages = [];
  if (!Array.isArray(images)) {
    invalidFields.push("images");
  } else {
    images.forEach((image, index) => {
      const decodedImage = decodeImage(image, index, invalidFields);
      if (decodedImage) {
        decodedImages.push(decodedImage);
      }
    });
  }

  const options = body.options === undefined ? [] : body.options;
  const normalizedOptions = [];
  if (!Array.isArray(options)) {
    invalidFields.push("options");
  } else {
    options.forEach((option, index) => {
      if (!option || typeof option !== "object" || Array.isArray(option)) {
        invalidFields.push(`options[${index}]`);
        return;
      }

      if (!isNonEmptyString(option.title)) {
        invalidFields.push(`options[${index}].title`);
      }
      if (
        option.shape !== undefined &&
        !["square", "circle"].includes(option.shape)
      ) {
        invalidFields.push(`options[${index}].shape`);
      }
      if (
        option.type !== undefined &&
        !["text", "color"].includes(option.type)
      ) {
        invalidFields.push(`options[${index}].type`);
      }

      let radius = 0;
      if (option.radius !== undefined) {
        if (Number.isSafeInteger(option.radius) && option.radius >= 0) {
          radius = option.radius;
        } else if (
          typeof option.radius === "string" &&
          /^\d+px$/.test(option.radius)
        ) {
          const parsedRadius = Number(option.radius.slice(0, -2));
          if (Number.isSafeInteger(parsedRadius)) {
            radius = parsedRadius;
          } else {
            invalidFields.push(`options[${index}].radius`);
          }
        } else {
          invalidFields.push(`options[${index}].radius`);
        }
      }

      const values = option.values === undefined ? option.value : option.values;
      if (
        !Array.isArray(values) ||
        values.some((value) => !isNonEmptyString(value))
      ) {
        invalidFields.push(`options[${index}].values`);
      } else {
        normalizedOptions.push({
          title: option.title,
          shape: option.shape === undefined ? "square" : option.shape,
          radius,
          type: option.type === undefined ? "text" : option.type,
          values: values.map((value) => value.trim()).join(", ")
        });
      }
    });
  }

  return {
    invalidFields: [...new Set(invalidFields)],
    product: {
      enabled: body.enabled === undefined ? false : body.enabled,
      name: body.name,
      slug: body.slug,
      stock: body.stock === undefined ? 0 : body.stock,
      description: body.description === undefined ? null : body.description,
      price: body.price,
      price_with_discount: body.price_with_discount
    },
    categoryIds: Array.isArray(categoryIds) ? [...new Set(categoryIds)] : [],
    images: decodedImages,
    options: normalizedOptions
  };
}

function isImageReference(content) {
  if (typeof content !== "string") {
    return false;
  }
  if (content.startsWith("/media/")) {
    return true;
  }

  try {
    const url = new URL(content);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateImageUpdates(images) {
  if (!Array.isArray(images)) {
    return { error: "images" };
  }

  const actions = [];
  const ids = new Set();
  const invalidFields = [];

  images.forEach((image, index) => {
    const field = `images[${index}]`;
    if (!image || typeof image !== "object" || Array.isArray(image)) {
      invalidFields.push(field);
      return;
    }

    const id = image.id;
    if (
      id !== undefined &&
      (!Number.isSafeInteger(id) || id < 1 || ids.has(id))
    ) {
      invalidFields.push(`${field}.id`);
    }
    if (id !== undefined) {
      ids.add(id);
    }
    if (
      image.deleted !== undefined &&
      typeof image.deleted !== "boolean"
    ) {
      invalidFields.push(`${field}.deleted`);
    }

    if (image.deleted === true) {
      if (id === undefined) {
        invalidFields.push(`${field}.id`);
      } else {
        actions.push({ id, deleted: true });
      }
      return;
    }

    if (image.content === undefined) {
      if (id === undefined || image.type !== undefined) {
        invalidFields.push(`${field}.content`);
      } else {
        actions.push({ id, keep: true });
      }
      return;
    }

    if (isImageReference(image.content)) {
      if (id === undefined) {
        invalidFields.push(`${field}.id`);
      } else {
        actions.push({ id, keep: true });
      }
      return;
    }

    const decodedImage = decodeImage(image, index, invalidFields);
    if (decodedImage) {
      actions.push({ id, image: decodedImage });
    }
  });

  return {
    actions,
    invalidFields: [...new Set(invalidFields)]
  };
}

function normalizeOptionValues(values, field, invalidFields) {
  if (
    !Array.isArray(values) ||
    values.length === 0 ||
    values.some((value) => !isNonEmptyString(value))
  ) {
    invalidFields.push(field);
    return undefined;
  }

  return values.map((value) => value.trim()).join(", ");
}

function normalizeOptionRadius(radius, field, invalidFields) {
  if (radius === undefined) {
    return undefined;
  }
  if (Number.isSafeInteger(radius) && radius >= 0) {
    return radius;
  }
  if (typeof radius === "string" && /^\d+px$/.test(radius)) {
    const parsedRadius = Number(radius.slice(0, -2));
    if (Number.isSafeInteger(parsedRadius)) {
      return parsedRadius;
    }
  }

  invalidFields.push(field);
  return undefined;
}

function validateOptionUpdates(options) {
  if (!Array.isArray(options)) {
    return { error: "options" };
  }

  const actions = [];
  const ids = new Set();
  const invalidFields = [];

  options.forEach((option, index) => {
    const field = `options[${index}]`;
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      invalidFields.push(field);
      return;
    }

    const id = option.id;
    if (
      id !== undefined &&
      (!Number.isSafeInteger(id) || id < 1 || ids.has(id))
    ) {
      invalidFields.push(`${field}.id`);
    }
    if (id !== undefined) {
      ids.add(id);
    }
    if (
      option.deleted !== undefined &&
      typeof option.deleted !== "boolean"
    ) {
      invalidFields.push(`${field}.deleted`);
    }

    if (option.deleted === true) {
      if (id === undefined) {
        invalidFields.push(`${field}.id`);
      } else {
        actions.push({ id, deleted: true });
      }
      return;
    }

    const changes = {};
    if (option.title !== undefined) {
      if (!isNonEmptyString(option.title)) {
        invalidFields.push(`${field}.title`);
      } else {
        changes.title = option.title;
      }
    } else if (id === undefined) {
      invalidFields.push(`${field}.title`);
    }

    if (option.shape !== undefined) {
      if (!["square", "circle"].includes(option.shape)) {
        invalidFields.push(`${field}.shape`);
      } else {
        changes.shape = option.shape;
      }
    }
    if (option.type !== undefined) {
      if (!["text", "color"].includes(option.type)) {
        invalidFields.push(`${field}.type`);
      } else {
        changes.type = option.type;
      }
    }
    if (option.radius !== undefined) {
      const radius = normalizeOptionRadius(
        option.radius,
        `${field}.radius`,
        invalidFields
      );
      if (radius !== undefined) {
        changes.radius = radius;
      }
    }

    if (option.values !== undefined && option.value !== undefined) {
      invalidFields.push(`${field}.values`);
    } else if (option.values !== undefined || option.value !== undefined) {
      const values = normalizeOptionValues(
        option.values === undefined ? option.value : option.values,
        `${field}.values`,
        invalidFields
      );
      if (values !== undefined) {
        changes.values = values;
      }
    } else if (id === undefined) {
      invalidFields.push(`${field}.values`);
    }

    if (id === undefined) {
      if (changes.shape === undefined) {
        changes.shape = "square";
      }
      if (changes.radius === undefined) {
        changes.radius = 0;
      }
      if (changes.type === undefined) {
        changes.type = "text";
      }
    }
    actions.push({ id, changes });
  });

  return {
    actions,
    invalidFields: [...new Set(invalidFields)]
  };
}

function validateProductUpdate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { invalidFields: ["body"] };
  }

  const invalidFields = [];
  for (const field of ["name", "slug"]) {
    if (!isNonEmptyString(body[field])) {
      invalidFields.push(field);
    }
  }

  if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
    invalidFields.push("enabled");
  }
  if (
    body.stock !== undefined &&
    (!Number.isSafeInteger(body.stock) || body.stock < 0)
  ) {
    invalidFields.push("stock");
  }
  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    invalidFields.push("description");
  }
  for (const field of ["price", "price_with_discount"]) {
    if (
      typeof body[field] !== "number" ||
      !Number.isFinite(body[field]) ||
      body[field] < 0
    ) {
      invalidFields.push(field);
    }
  }

  let categoryIds;
  if (body.category_ids !== undefined) {
    if (
      !Array.isArray(body.category_ids) ||
      body.category_ids.some(
        (id) => !Number.isSafeInteger(id) || id < 1
      )
    ) {
      invalidFields.push("category_ids");
    } else {
      categoryIds = [...new Set(body.category_ids)];
    }
  }

  let imageActions;
  if (body.images !== undefined) {
    const result = validateImageUpdates(body.images);
    if (result.error) {
      invalidFields.push(result.error);
    } else {
      invalidFields.push(...result.invalidFields);
      imageActions = result.actions;
    }
  }

  let optionActions;
  if (body.options !== undefined) {
    const result = validateOptionUpdates(body.options);
    if (result.error) {
      invalidFields.push(result.error);
    } else {
      invalidFields.push(...result.invalidFields);
      optionActions = result.actions;
    }
  }

  const product = {};
  for (const field of [
    "enabled",
    "name",
    "slug",
    "stock",
    "description",
    "price",
    "price_with_discount"
  ]) {
    if (body[field] !== undefined) {
      product[field] = body[field];
    }
  }

  return {
    invalidFields: [...new Set(invalidFields)],
    product,
    categoryIds,
    imageActions,
    optionActions
  };
}

function resolveManagedImagePath(relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.isAbsolute(relativePath) ||
    /^[a-z]+:\/\//i.test(relativePath)
  ) {
    return null;
  }

  const absolutePath = path.resolve(mediaDirectory, ...relativePath.split(/[\\/]/));
  const mediaRoot = `${path.resolve(mediaDirectory)}${path.sep}`;
  return absolutePath.startsWith(mediaRoot) ? absolutePath : null;
}

async function create(request, response) {
  const validated = validateProduct(request.body);
  if (validated.invalidFields.length > 0) {
    return response.status(400).json({
      error: "Dados do produto inválidos",
      fields: validated.invalidFields
    });
  }

  const categories = await Category.findAll({
    attributes: ["id"],
    where: { id: validated.categoryIds }
  });
  if (categories.length !== validated.categoryIds.length) {
    return response.status(400).json({
      error: "Dados do produto inválidos",
      fields: ["category_ids"]
    });
  }

  let productDirectory;
  const product = await sequelize.transaction(async (transaction) => {
    const createdProduct = await Product.create(validated.product, { transaction });
    const relativeDirectory = path.posix.join(
      "products",
      String(createdProduct.id)
    );
    productDirectory = path.join(mediaDirectory, ...relativeDirectory.split("/"));

    if (validated.categoryIds.length > 0) {
      await ProductCategory.bulkCreate(
        validated.categoryIds.map((categoryId) => ({
          product_id: createdProduct.id,
          category_id: categoryId
        })),
        { transaction }
      );
    }

    if (validated.images.length > 0) {
      await mkdir(productDirectory, { recursive: true });
      for (const image of validated.images) {
        const filename = `${randomUUID()}.${image.extension}`;
        const imagePath = path.join(productDirectory, filename);
        const relativePath = path.posix.join(relativeDirectory, filename);
        await writeFile(imagePath, image.buffer, { flag: "wx" });
        await ProductImage.create(
          {
            product_id: createdProduct.id,
            path: relativePath
          },
          { transaction }
        );
      }
    }

    if (validated.options.length > 0) {
      await ProductOption.bulkCreate(
        validated.options.map((option) => ({
          product_id: createdProduct.id,
          ...option
        })),
        { transaction }
      );
    }

    return Product.findByPk(createdProduct.id, {
      include: productIncludes(),
      transaction
    });
  }).catch(async (error) => {
    if (productDirectory) {
      await rm(productDirectory, { recursive: true, force: true });
    }
    throw error;
  });

  return response
    .status(201)
    .location(`/v1/product/${product.id}`)
    .json(serializeProduct(product));
}

async function update(request, response) {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  const product = await Product.findByPk(id);
  if (!product) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  const validated = validateProductUpdate(request.body);
  if (validated.invalidFields.length > 0) {
    return response.status(400).json({
      error: "Dados do produto inválidos",
      fields: validated.invalidFields
    });
  }

  const [images, options] = await Promise.all([
    ProductImage.findAll({ where: { product_id: id } }),
    ProductOption.findAll({ where: { product_id: id } })
  ]);
  const imagesById = new Map(images.map((image) => [image.id, image]));
  const optionsById = new Map(options.map((option) => [option.id, option]));

  if (
    validated.imageActions?.some(
      (action) => action.id !== undefined && !imagesById.has(action.id)
    )
  ) {
    return response.status(400).json({
      error: "Dados do produto inválidos",
      fields: ["images"]
    });
  }
  if (
    validated.optionActions?.some(
      (action) => action.id !== undefined && !optionsById.has(action.id)
    )
  ) {
    return response.status(400).json({
      error: "Dados do produto inválidos",
      fields: ["options"]
    });
  }

  if (validated.categoryIds !== undefined) {
    const categories = await Category.findAll({
      attributes: ["id"],
      where: { id: validated.categoryIds }
    });
    if (categories.length !== validated.categoryIds.length) {
      return response.status(400).json({
        error: "Dados do produto inválidos",
        fields: ["category_ids"]
      });
    }
  }

  const newFiles = [];
  const obsoleteFiles = [];
  let productStillExists = true;

  try {
    await sequelize.transaction(async (transaction) => {
      const currentProduct = await Product.findByPk(id, { transaction });
      if (!currentProduct) {
        productStillExists = false;
        return;
      }

      await currentProduct.update(validated.product, { transaction });

      if (validated.categoryIds !== undefined) {
        await ProductCategory.destroy({
          where: { product_id: id },
          transaction
        });
        if (validated.categoryIds.length > 0) {
          await ProductCategory.bulkCreate(
            validated.categoryIds.map((categoryId) => ({
              product_id: id,
              category_id: categoryId
            })),
            { transaction }
          );
        }
      }

      for (const action of validated.imageActions || []) {
        const existingImage = action.id === undefined ? null : imagesById.get(action.id);
        if (action.deleted) {
          await existingImage.destroy({ transaction });
          const obsoleteFile = resolveManagedImagePath(existingImage.path);
          if (obsoleteFile) {
            obsoleteFiles.push(obsoleteFile);
          }
          continue;
        }
        if (!action.image) {
          continue;
        }

        const relativeDirectory = path.posix.join("products", String(id));
        const productDirectory = path.join(
          mediaDirectory,
          ...relativeDirectory.split("/")
        );
        await mkdir(productDirectory, { recursive: true });
        const filename = `${randomUUID()}.${action.image.extension}`;
        const imagePath = path.join(productDirectory, filename);
        const relativePath = path.posix.join(relativeDirectory, filename);
        newFiles.push(imagePath);
        await writeFile(imagePath, action.image.buffer, { flag: "wx" });

        if (existingImage) {
          const previousPath = existingImage.path;
          await existingImage.update({ path: relativePath }, { transaction });
          const obsoleteFile = resolveManagedImagePath(previousPath);
          if (obsoleteFile) {
            obsoleteFiles.push(obsoleteFile);
          }
        } else {
          await ProductImage.create(
            { product_id: id, path: relativePath },
            { transaction }
          );
        }
      }

      for (const action of validated.optionActions || []) {
        if (action.deleted) {
          await optionsById.get(action.id).destroy({ transaction });
        } else if (action.id === undefined) {
          await ProductOption.create(
            { product_id: id, ...action.changes },
            { transaction }
          );
        } else if (Object.keys(action.changes).length > 0) {
          await optionsById.get(action.id).update(action.changes, { transaction });
        }
      }
    });
  } catch (error) {
    await Promise.all(newFiles.map((file) => rm(file, { force: true })));
    throw error;
  }

  if (!productStillExists) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  await Promise.all(obsoleteFiles.map((file) => rm(file, { force: true })));
  return response.status(204).end();
}

async function remove(request, response) {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  const obsoleteFiles = [];
  const deleted = await sequelize.transaction(async (transaction) => {
    const product = await Product.findByPk(id, { transaction });
    if (!product) {
      return false;
    }

    const images = await ProductImage.findAll({
      attributes: ["path"],
      where: { product_id: id },
      transaction
    });
    for (const image of images) {
      const file = resolveManagedImagePath(image.path);
      if (file) {
        obsoleteFiles.push(file);
      }
    }

    await ProductImage.destroy({ where: { product_id: id }, transaction });
    await ProductOption.destroy({ where: { product_id: id }, transaction });
    await ProductCategory.destroy({ where: { product_id: id }, transaction });
    await product.destroy({ transaction });
    return true;
  });

  if (!deleted) {
    return response.status(404).json({ error: "Produto não encontrado" });
  }

  await Promise.all(obsoleteFiles.map((file) => rm(file, { force: true })));
  return response.status(204).end();
}

module.exports = { create, update, remove };
