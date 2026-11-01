function isAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    if (req.accepts("html")) return res.redirect("/auth/login");
    return res.status(401).json({ error: "Authentication required" });
}

function isOwner(getOwnerId) {
    return (req, res, next) => {
        const ownerId = getOwnerId(req);
        if (ownerId && ownerId === req.user?.id) return next();
        return res.status(403).render("errors/403", { message: "Forbidden" });
    };
}

module.exports = { isAuthenticated, isOwner };