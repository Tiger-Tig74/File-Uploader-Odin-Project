const router = require("express").Router();
const fileController = require("../controllers/fileController");
const { isAuthenticated } = require("../middleware/auth");
const { uploadSingle } = require("../middleware/upload");

router.use(isAuthenticated);

router.post("/", uploadSingle("file"), fileController.upload);
router.get("/:id", fileController.show);
router.get("/:id/download", fileController.download);
router.post("/:id/delete", fileController.destroy);

module.exports = router;