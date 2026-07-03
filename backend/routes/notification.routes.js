const router = require("express").Router();
const notificationController = require("../controllers/notification.controller");
const auth = require("../middleware/auth");

router.post("/daily-plan", auth, notificationController.sendDailyPlan);
router.post("/sync", auth, notificationController.syncNotifications);

module.exports = router;
