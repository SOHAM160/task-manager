const router = require("express").Router();
const scheduleController = require("../controllers/schedule.controller");
const auth = require("../middleware/auth");

router.get("/", auth, scheduleController.getSchedule);

module.exports = router;
