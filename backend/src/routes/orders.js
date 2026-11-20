const express = require("express");
const ordersController = require("../controllers/ordersController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);
router.get("/", ordersController.list);
router.post("/", ordersController.create);

module.exports = router;
