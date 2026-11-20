const express = require("express");
const cors = require("cors");
const path = require("node:path");
const mediaDirectory = require("./config/mediaDirectory");
const router = require("./routes/router");
const usersRouter = require("./routes/users");
const categoriesRouter = require("./routes/categories");
const v1ProductsRouter = require("./routes/v1Products");
const ordersRouter = require("./routes/orders");

const app = express();
const frontendDist = path.resolve(__dirname, "../../frontend/dist");

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api", router);
app.use("/v1/user", usersRouter);
app.use("/v1/category", categoriesRouter);
app.use("/v1/product", v1ProductsRouter);
app.use("/v1/order", ordersRouter);
app.use("/media", express.static(mediaDirectory));
app.use(express.static(frontendDist));

app.use((request, response, next) => {
  if (request.path === "/api" || request.path.startsWith("/api/")) {
    return response.status(404).json({ error: "Rota não encontrada" });
  }

  if (request.method !== "GET" || !request.accepts("html")) {
    return response.status(404).json({ error: "Rota não encontrada" });
  }

  return response.sendFile(path.join(frontendDist, "index.html"), (error) => {
    if (error) {
      next(error);
    }
  });
});

app.use((request, response) => {
  response.status(404).json({ error: "Rota não encontrada" });
});

module.exports = app;