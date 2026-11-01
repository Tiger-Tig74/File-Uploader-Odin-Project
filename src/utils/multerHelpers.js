const fs = require("fs/promises");
const path = require("path");

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function deleteLocalFile(urlPath) {
    try {
        const relative = urlPath.replace(/^\/uploads\//, "");
        const abs = path.join(__dirname, "..", "..", "uploads", relative);
        await fs.unlink(abs);
    } catch (err) {
        if (err.code !== "ENOENT") throw err;
    }
}

module.exports = { formatBytes, deleteLocalFile };