const router = require("express").Router();
const tagController = require("../controllers/tag.controller");
const auth = require("../middleware/auth");

router.get("/", auth, tagController.getTags);
router.post("/", auth, tagController.createTag);

module.exports = router;
