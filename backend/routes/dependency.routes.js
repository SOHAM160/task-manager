const router = require("express").Router();
const depController = require("../controllers/dependency.controller");
const auth = require("../middleware/auth");

router.post("/add", auth, depController.addDependency);
router.post("/remove", auth, depController.removeDependency);
router.get("/graph", auth, depController.getGraph);
router.get("/critical-path", auth, depController.getCriticalPath);
router.get("/blocked/:taskId", auth, depController.getBlockedStatus);

module.exports = router;
