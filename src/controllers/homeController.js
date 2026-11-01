const prisma = require("../config/prisma");

exports.dashboard = async (req, res, next) => {
    try {
        const [folderCount, fileCount, folders, recentFiles] = await Promise.all([
            prisma.folder.count({ where: { ownerId: req.user.id } }),
            prisma.file.count({ where: { ownerId: req.user.id } }),
            prisma.folder.findMany({
                where: { ownerId: req.user.id, parentId: null },
                orderBy: { name: "asc" },
                take: 12,
            }),
            prisma.file.findMany({
                where: { ownerId: req.user.id },
                orderBy: { uploadedAt: "desc" },
                take: 8,
            }),
        ]);

        res.render("index", {
            counts: { folders: folderCount, files: fileCount },
            folders,
            recentFiles,
        });
    } catch (err) {
        next(err);
    }
};