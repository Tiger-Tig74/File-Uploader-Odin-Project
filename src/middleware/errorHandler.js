function notFound(req, res) {
    res.status(404).render("errors/404", { message: "Page not found" });
}

function errorHandler(err, req, res, _next) {
    console.error("[ERROR]", err);
    const status = err.status || 500;
    if (req.accepts("html")) {
        return res.status(status).render("errors/500", {
            message: err.message || "Something went wrong",
        });
    }
    res.status(status).json({ error: err.message || "Internal server error" });
}

module.exports = { notFound, errorHandler };