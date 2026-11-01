const app = require("./app");
const prisma = require("./config/prisma");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

async function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down...`);
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
}

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));