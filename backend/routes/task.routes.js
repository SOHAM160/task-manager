const router = require("express").Router();
const taskController = require("../controllers/task.controller");
const commentController = require("../controllers/comment.controller");
const auth = require("../middleware/auth");

router.get("/", auth, taskController.getTasks);
router.post("/", auth, taskController.createTask);
router.put("/:id", auth, taskController.updateTask);
router.delete("/:id", auth, taskController.deleteTask);

// Comments sub-routes
router.get("/:id/comments", auth, commentController.getComments);
router.post("/:id/comments", auth, commentController.createComment);

module.exports = router;
