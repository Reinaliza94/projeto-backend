const express = require("express");
const productSearchController = require("../controllers/productSearchController");
const productWriteController = require("../controllers/productWriteController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/search", productSearchController.search);
router.get("/:id", productSearchController.getById);
router.post("/", requireAuth, productWriteController.create);
router.put("/:id", requireAuth, productWriteController.update);
router.delete("/:id", requireAuth, productWriteController.remove);

module.exports = router;
