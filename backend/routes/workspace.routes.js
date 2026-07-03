const router = require("express").Router();
const workspaceController = require("../controllers/workspace.controller");
const auth = require("../middleware/auth");

router.get("/", auth, workspaceController.getWorkspaces);
router.post("/", auth, workspaceController.createWorkspace);
router.delete("/:id", auth, workspaceController.deleteWorkspace);
router.post("/join", auth, workspaceController.joinWorkspace);

module.exports = router;
