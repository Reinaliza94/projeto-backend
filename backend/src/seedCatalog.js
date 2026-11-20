require("dotenv").config({ path: require("node:path").resolve(__dirname, "../.env") });

const sequelize = require("./config/sequelize");
const Category = require("./models/Category");
const Product = require("./models/Product");
const ProductImage = require("./models/ProductImage");
const ProductOption = require("./models/ProductOption");
const ProductCategory = require("./models/ProductCategory");

const categoryData = [
  { name: "Roupas", slug: "roupas" },
  { name: "Calçados", slug: "calcados" },
  { name: "Acessórios", slug: "acessorios" },
  { name: "Eletrônicos", slug: "eletronicos" }
];

const products = [
  {
    name: "Tênis Casual Masculino",
    slug: "tenis-casual-masculino",
    brand: "Nike",
    subcategory: "Casual",
    gender: "Masculino",
    condition: "Novo",
    price: 299.9,
    price_with_discount: 249.9,
    image: "produc-image-1.jpeg"
  },
  {
    name: "Tênis Casual Unissex",
    slug: "tenis-casual-unissex-adidas",
    brand: "Adidas",
    subcategory: "Corrida",
    gender: "Unissex",
    condition: "Novo",
    price: 259.9,
    price_with_discount: 199.9,
    image: "produc-image-2.jpeg"
  },
  {
    name: "Tênis Feminino Casual",
    slug: "tenis-feminino-casual",
    brand: "Puma",
    subcategory: "Esporte e lazer",
    gender: "Feminino",
    condition: "Novo",
    price: 189.9,
    price_with_discount: 149.9,
    image: "produc-image-3.jpeg"
  },
  {
    name: "Tênis Casual Unissex Olympikus",
    slug: "tenis-casual-unissex-olympikus",
    brand: "Olympikus",
    subcategory: "Utilitário",
    gender: "Unissex",
    condition: "Usado",
    price: 129.9,
    price_with_discount: 99.9,
    image: "produc-image-4.jpeg"
  },
  {
    name: "Tênis Esportivo Masculino",
    slug: "tenis-esportivo-masculino",
    brand: "Nike",
    subcategory: "Esporte e lazer",
    gender: "Masculino",
    condition: "Novo",
    price: 129.9,
    price_with_discount: 99.9,
    image: "produc-image-5.jpeg"
  },
  {
    name: "Tênis Feminino Casual Adidas",
    slug: "tenis-feminino-casual-adidas",
    brand: "Adidas",
    subcategory: "Casual",
    gender: "Feminino",
    condition: "Novo",
    price: 189.9,
    price_with_discount: 149.9,
    image: "produc-image-3.jpeg"
  },
  {
    name: "Tênis Casual Unissex Olympikus Corrida",
    slug: "tenis-casual-unissex-olympikus-corrida",
    brand: "Olympikus",
    subcategory: "Corrida",
    gender: "Unissex",
    condition: "Novo",
    price: 129.9,
    price_with_discount: 99.9,
    image: "produc-image-4.jpeg"
  },
  {
    name: "Tênis Esportivo Masculino Puma",
    slug: "tenis-esportivo-masculino-puma",
    brand: "Puma",
    subcategory: "Utilitário",
    gender: "Masculino",
    condition: "Usado",
    price: 129.9,
    price_with_discount: 99.9,
    image: "produc-image-5.jpeg"
  }
];

async function seedCatalog() {
  if (await Product.count()) {
    return 0;
  }

  const transaction = await sequelize.transaction();
  try {
    const categories = {};
    for (const data of categoryData) {
      const [category] = await Category.findOrCreate({
        where: { slug: data.slug },
        defaults: { ...data, use_in_menu: true },
        transaction
      });
      categories[data.slug] = category;
    }

    const shoes = categories.calcados;
    for (const data of products) {
      const product = await Product.create({
        enabled: true,
        name: data.name,
        slug: data.slug,
        stock: 10,
        description: `${data.brand} ${data.subcategory} para ${data.gender.toLowerCase()}.`,
        price: data.price,
        price_with_discount: data.price_with_discount
      }, { transaction });

      await ProductCategory.create({
        product_id: product.id,
        category_id: shoes.id
      }, { transaction });

      await ProductImage.create({
        product_id: product.id,
        enabled: true,
        path: `/products/${data.image}`
      }, { transaction });

      await ProductOption.bulkCreate([
        { product_id: product.id, title: "Cor", type: "color", values: "Azul, Rosa, Marrom" },
        { product_id: product.id, title: "Tamanho", values: "34, 35, 36, 38, 40, 41, 42" },
        { product_id: product.id, title: "Marca", values: data.brand },
        { product_id: product.id, title: "Subcategoria", values: data.subcategory },
        { product_id: product.id, title: "Gênero", values: data.gender },
        { product_id: product.id, title: "Estado", values: data.condition }
      ], { transaction });
    }

    await transaction.commit();
    return products.length;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

if (require.main === module) {
  sequelize.sync()
    .then(seedCatalog)
    .then((count) => {
      console.log(count
        ? `${count} produtos de demonstração adicionados ao banco.`
        : "O catálogo já possui produtos; nenhuma alteração foi feita.");
    })
    .catch((error) => {
      console.error("Não foi possível preparar o catálogo:", error);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = seedCatalog;
