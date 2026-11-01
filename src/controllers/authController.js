const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const passport = require("../config/passport");

function renderRegister(req, res, errors = [], values = {}) {
    res.status(200).render("auth/register", { errors, values });
}

exports.showRegister = (req, res) => renderRegister(req, res);

exports.register = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return renderRegister(req, res, errors.array(), { email: req.body.email });
    }

    try {
        const { email, password } = req.body;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return renderRegister(req, res, [{ msg: "Email already in use" }], { email });
        }

        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, password: hashed },
        });

        req.login(user, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome! Your account is ready.");
            res.redirect("/folders");
        });
    } catch (err) {
        next(err);
    }
};

exports.showLogin = (req, res) => {
    res.render("auth/login", { errors: [], values: {} });
};

exports.login = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render("auth/login", {
            errors: errors.array(),
            values: { email: req.body.email },
        });
    }

    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).render("auth/login", {
                errors: [{ msg: info?.message || "Invalid credentials" }],
                values: { email: req.body.email },
            });
        }
        req.login(user, (err2) => {
            if (err2) return next(err2);
            req.flash("success", "Logged in successfully");
            res.redirect("/folders");
        });
    })(req, res, next);
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err2) => {
            if (err2) return next(err2);
            res.clearCookie("connect.sid");
            res.redirect("/auth/login");
        });
    });
};