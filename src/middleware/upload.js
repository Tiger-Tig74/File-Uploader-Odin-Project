const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const MAX_FILE_SIZE = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/json",
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(__dirname, "..", "..", "uploads")),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
        cb(null, unique);
    },
});

function fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Unsupported file type"));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});

function uploadSingle(fieldName) {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (!err) return next();
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).render("errors/400", {
                        message: `File too large. Max ${process.env.MAX_FILE_SIZE_MB || 10} MB.`,
                    });
                }
                return res.status(400).render("errors/400", { message: err.message });
            }
            return next(err);
        });
    };
}

module.exports = { uploadSingle, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };