const router = require("express").Router();
const folderController = require("../controllers/folderController");
const { isAuthenticated } = require("../middleware/auth");
const { folderNameRules } = require("../utils/validators");

router.use(isAuthenticated);

router.get("/", folderController.index);
router.get("/:id", folderController.show);

router.post("/", folderNameRules, folderController.create);
router.post("/:id/rename", folderNameRules, folderController.rename);
router.post("/:id/delete", folderController.destroy);

module.exports = router;