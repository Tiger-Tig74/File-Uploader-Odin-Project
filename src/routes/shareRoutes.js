const router = require("express").Router();
const shareController = require("../controllers/shareController");
const { isAuthenticated } = require("../middleware/auth");

router.get("/:token", shareController.view);
router.get("/:token/file/:fileId/download", shareController.downloadViaShare);

router.post("/", isAuthenticated, shareController.create);
router.post("/:id/revoke", isAuthenticated, shareController.revoke);

module.exports = router;