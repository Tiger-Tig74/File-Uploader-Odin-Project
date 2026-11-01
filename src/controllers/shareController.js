const crypto = require("crypto");
const prisma = require("../config/prisma");

exports.create = async (req, res, next) => {
    try {
        const { folderId, duration } = req.body;
        const days = Number(duration);
        if (!Number.isInteger(days) || days < 1 || days > 30) {
            req.flash("error", "Duration must be between 1 and 30 days");
            return res.redirect(`/folders/${folderId}`);
        }

        const folder = await prisma.folder.findFirst({
            where: { id: folderId, ownerId: req.user.id },
        });
        if (!folder) {
            return res.status(403).render("errors/403", { message: "Not your folder" });
        }

        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        const share = await prisma.share.create({
            data: { token, folderId, expiresAt },
        });

        const url = `${req.protocol}://${req.get("host")}/share/${share.token}`;
        req.flash("success", `Share link (${days}d): ${url}`);
        res.redirect(`/folders/${folderId}`);
    } catch (err) {
        next(err);
    }
};

exports.view = async (req, res, next) => {
    try {
        const share = await prisma.share.findUnique({
            where: { token: req.params.token },
            include: {
                folder: {
                    include: {
                        files: { orderBy: { uploadedAt: "desc" } },
                        children: { orderBy: { name: "asc" } },
                        owner: { select: { email: true } },
                    },
                },
            },
        });

        if (!share) {
            return res.status(404).render("errors/404", { message: "Share link not found" });
        }
        if (share.expiresAt < new Date()) {
            return res.status(410).render("errors/404", {
                message: "This share link has expired",
            });
        }

        res.render("share/public", { share, folder: share.folder });
    } catch (err) {
        next(err);
    }
};

exports.revoke = async (req, res, next) => {
    try {
        const share = await prisma.share.findUnique({
            where: { id: req.params.id },
            include: { folder: true },
        });
        if (!share || share.folder.ownerId !== req.user.id) {
            return res.status(404).render("errors/404", { message: "Share not found" });
        }
        await prisma.share.delete({ where: { id: share.id } });
        req.flash("success", "Share link revoked");
        res.redirect(`/folders/${share.folderId}`);
    } catch (err) {
        next(err);
    }
};

exports.downloadViaShare = async (req, res, next) => {
    try {
        const { token, fileId } = req.params;
        const share = await prisma.share.findUnique({ where: { token } });
        if (!share || share.expiresAt < new Date()) {
            return res.status(404).render("errors/404", { message: "Share invalid" });
        }

        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file) {
            return res.status(404).render("errors/404", { message: "File not found" });
        }

        let folderId = file.folderId;
        let ok = false;
        while (folderId) {
            if (folderId === share.folderId) { ok = true; break; }
            const parent = await prisma.folder.findUnique({ where: { id: folderId } });
            folderId = parent?.parentId || null;
        }
        if (!ok) {
            return res.status(403).render("errors/403", { message: "File not in share" });
        }

        const path = require("path");
        const abs = path.join(__dirname, "..", "..", "uploads", path.basename(file.url));
        res.download(abs, file.name);
    } catch (err) {
        next(err);
    }
};