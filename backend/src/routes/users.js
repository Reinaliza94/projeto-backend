const express = require("express");
const usersController = require("../controllers/usersController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/token", usersController.generateToken);
router.post("/", usersController.create);
router.get("/:id", usersController.getById);
router.put("/:id", requireAuth, usersController.update);
router.delete("/:id", requireAuth, usersController.remove);

module.exports = router;
