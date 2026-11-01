require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const engine = require("ejs-mate");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const prisma = require("./config/prisma");
const passport = require("./config/passport");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const homeController = require("./controllers/homeController");
const authRoutes = require("./routes/authRoutes");
const folderRoutes = require("./routes/folderRoutes");
const fileRoutes = require("./routes/fileRoutes");
const shareRoutes = require("./routes/shareRoutes");

const app = express();

app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "dev-secret",
        resave: false,
        saveUninitialized: false,
        store: new PrismaSessionStore(prisma, {
            checkPeriod: 2 * 60 * 1000,
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
    res.locals.currentUser = req.user || null;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.get("/", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/auth/login");
    return homeController.dashboard(req, res, (err) => {
        if (err) return res.status(500).render("errors/500", { message: "Server error" });
    });
});

app.use("/auth", authRoutes);
app.use("/folders", folderRoutes);
app.use("/files", fileRoutes);
app.use("/share", shareRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;