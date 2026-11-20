const express = require("express");
const productsRouter = require("./products");

const router = express.Router();

router.get("/health", (request, response) => {
  response.json({ status: "ok" });
});

router.use("/products", productsRouter);

module.exports = router;