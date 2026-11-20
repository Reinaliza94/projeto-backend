const express = require("express");
const categoriesController = require("../controllers/categoriesController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/search", categoriesController.search);
router.get("/:id", categoriesController.getById);
router.post("/", requireAuth, categoriesController.create);
router.put("/:id", requireAuth, categoriesController.update);
router.delete("/:id", requireAuth, categoriesController.remove);

module.exports = router;
