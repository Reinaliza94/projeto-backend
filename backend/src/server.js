require("dotenv").config({ path: require("node:path").resolve(__dirname, "../.env") });

const sequelize = require("./config/sequelize");
require("./models/User");
require("./models/Category");
require("./models/Product");
require("./models/ProductImage");
require("./models/ProductOption");
require("./models/ProductCategory");
require("./models/Order");
require("./models/OrderItem");

const port = process.env.PORT || 3000;

async function startServer() {
  await sequelize.sync();
  const app = require("./app");

  app.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Não foi possível iniciar o backend:", error);
  process.exitCode = 1;
});
