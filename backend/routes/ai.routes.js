const router = require("express").Router();
const aiController = require("../controllers/ai.controller");
const auth = require("../middleware/auth");

router.post("/breakdown", auth, aiController.breakdown);
router.get("/schedule", auth, aiController.aiSchedule);

module.exports = router;
