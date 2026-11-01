const { body, param } = require("express-validator");

const registerRules = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Enter a valid email")
        .normalizeEmail(),
    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters"),
    body("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) throw new Error("Passwords do not match");
        return true;
    }),
];

const loginRules = [
    body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
];

const folderNameRules = [
    body("name")
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Folder name must be 1–100 characters")
        .matches(/^[\w\s\-.,()&]+$/)
        .withMessage("Folder name contains invalid characters"),
];

const shareDurationRules = [
    body("duration")
        .isInt({ min: 1, max: 30 })
        .withMessage("Duration must be between 1 and 30 days"),
];

const idParamRule = [param("id").isUUID().withMessage("Invalid id")];

module.exports = {
    registerRules,
    loginRules,
    folderNameRules,
    shareDurationRules,
    idParamRule,
};