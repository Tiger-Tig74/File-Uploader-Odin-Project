const path = require("path");
const prisma = require("../config/prisma");
const { formatBytes, deleteLocalFile } = require("../utils/multerHelpers");

exports.show = async (req, res, next) => {
    try {
        const file = await prisma.file.findFirst({
            where: { id: req.params.id, ownerId: req.user.id },
            include: { folder: true },
        });
        if (!file) {
            return res.status(404).render("errors/404", { message: "File not found" });
        }
        res.render("files/detail", { file, prettySize: formatBytes(file.size) });
    } catch (err) {
        next(err);
    }
};

exports.upload = async (req, res, next) => {
    try {
        if (!req.file) {
            req.flash("error", "No file selected");
            const back = req.body.folderId ? `/folders/${req.body.folderId}` : "/folders";
            return res.redirect(back);
        }

        let folderId = req.body.folderId || null;
        if (folderId) {
            const folder = await prisma.folder.findFirst({
                where: { id: folderId, ownerId: req.user.id },
            });
            if (!folder) {
                await deleteLocalFile(`/uploads/${req.file.filename}`);
                return res.status(403).render("errors/403", { message: "Not your folder" });
            }
        }

        const url = `/uploads/${req.file.filename}`;
        const file = await prisma.file.create({
            data: {
                name: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                url,
                folderId,
                ownerId: req.user.id,
            },
        });

        req.flash("success", `Uploaded "${file.name}" (${formatBytes(file.size)})`);
        res.redirect(folderId ? `/folders/${folderId}` : "/folders");
    } catch (err) {
        if (req.file) await deleteLocalFile(`/uploads/${req.file.filename}`);
        next(err);
    }
};

exports.download = async (req, res, next) => {
    try {
        const file = await prisma.file.findFirst({
            where: { id: req.params.id, ownerId: req.user.id },
        });
        if (!file) {
            return res.status(404).render("errors/404", { message: "File not found" });
        }

        const absPath = path.join(__dirname, "..", "..", "uploads", path.basename(file.url));
        res.download(absPath, file.name, (err) => {
            if (err && !res.headersSent) next(err);
        });
    } catch (err) {
        next(err);
    }
};

exports.destroy = async (req, res, next) => {
    try {
        const file = await prisma.file.findFirst({
            where: { id: req.params.id, ownerId: req.user.id },
        });
        if (!file) {
            return res.status(404).render("errors/404", { message: "File not found" });
        }

        await prisma.file.delete({ where: { id: file.id } });
        await deleteLocalFile(file.url);

        req.flash("success", `Deleted "${file.name}"`);
        res.redirect(file.folderId ? `/folders/${file.folderId}` : "/folders");
    } catch (err) {
        next(err);
    }
};