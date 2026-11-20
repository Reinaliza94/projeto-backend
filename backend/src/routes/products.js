const express = require("express");
const productsController = require("../controllers/productsController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", productsController.list);
router.get("/:id", productsController.getById);
router.post("/", requireAuth, productsController.create);
router.put("/:id", requireAuth, productsController.update);
router.delete("/:id", requireAuth, productsController.remove);

module.exports = router;
