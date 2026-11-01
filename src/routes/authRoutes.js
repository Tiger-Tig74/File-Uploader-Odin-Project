const router = require("express").Router();
const authController = require("../controllers/authController");
const { registerRules, loginRules } = require("../utils/validators");
const { isAuthenticated } = require("../middleware/auth");

router.get("/register", (req, res) =>
    req.isAuthenticated() ? res.redirect("/folders") : authController.showRegister(req, res)
);
router.post("/register", registerRules, authController.register);

router.get("/login", (req, res) =>
    req.isAuthenticated() ? res.redirect("/folders") : authController.showLogin(req, res)
);
router.post("/login", loginRules, authController.login);

router.post("/logout", isAuthenticated, authController.logout);
router.get("/logout", isAuthenticated, authController.logout);

module.exports = router;