const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");

exports.index = async (req, res, next) => {
    try {
        const folders = await prisma.folder.findMany({
            where: { ownerId: req.user.id, parentId: null },
            orderBy: { name: "asc" },
        });
        const files = await prisma.file.findMany({
            where: { ownerId: req.user.id, folderId: null },
            orderBy: { uploadedAt: "desc" },
        });
        res.render("folders/show", {
            folders,
            files,
            shares: [],
            currentFolder: null,
            breadcrumbs: [],
        });
    } catch (err) {
        next(err);
    }
};

exports.show = async (req, res, next) => {
    try {
        const folder = await prisma.folder.findFirst({
            where: { id: req.params.id, ownerId: req.user.id },
            include: {
                children: { orderBy: { name: "asc" } },
                files: { orderBy: { uploadedAt: "desc" } },
                parent: true,
                shares: { orderBy: { createdAt: "desc" } },
            },
        });
        if (!folder) {
            return res.status(404).render("errors/404", { message: "Folder not found" });
        }

        const breadcrumbs = [];
        let cursor = folder;
        while (cursor) {
            breadcrumbs.unshift({ id: cursor.id, name: cursor.name });
            if (!cursor.parentId) break;
            cursor = await prisma.folder.findUnique({ where: { id: cursor.parentId } });
        }

        res.render("folders/show", {
            folders: folder.children,
            files: folder.files,
            shares: folder.shares,
            currentFolder: folder,
            breadcrumbs,
        });
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash("error", errors.array()[0].msg);
        return res.redirect(req.body.parentId ? `/folders/${req.body.parentId}` : "/folders");
    }

    try {
        const { name, parentId } = req.body;

        if (parentId) {
            const parent = await prisma.folder.findFirst({
                where: { id: parentId, ownerId: req.user.id },
            });
            if (!parent) {
                return res.status(403).render("errors/403", { message: "Not your folder" });
            }
        }

        const folder = await prisma.folder.create({
            data: { name: name.trim(), ownerId: req.user.id, parentId: parentId || null },
        });
        req.flash("success", `Folder "${folder.name}" created`);
        res.redirect(parentId ? `/folders/${parentId}` : "/folders");
    } catch (err) {
        next(err);
    }
};

exports.rename = async (req, res, next) => {
    try {
        const folder = await prisma.folder.findFirst({
            where: { id: req.params.id, ownerId: req.user.id },
        });
        if (!folder) {
            return res.status(404).render("errors/404", { message: "Folder not found" });
        }

        const name = (req.body.name || "").trim();
        if (name.length < 1 || name.length > 100) {
            req.flash("error", "Folder name must be 1–100 characters");
            return res.redirect(`/folders/${folder.parentId || ""}`.replace(/\/$/, "") || "/folders");
        }

        await prisma.folder.update({ where: { id: folder.id }, data: { name } });
        req.flash("success", "Folder renamed");
        res.redirect(folder.parentId ? `/folders/${folder.parentId}` : "/folders");
    } catch (err) {
        next(err);
    }
};

exports.destroy = async (req, res, next) => {
    try {
        const folder = await prisma.folder.findFirst({
            where: { id: req.params.id, ownerId: req.user.id },
        });
        if (!folder) {
            return res.status(404).render("errors/404", { message: "Folder not found" });
        }
        await prisma.folder.delete({ where: { id: folder.id } });
        req.flash("success", "Folder deleted");
        res.redirect(folder.parentId ? `/folders/${folder.parentId}` : "/folders");
    } catch (err) {
        next(err);
    }
};