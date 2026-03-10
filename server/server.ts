import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express'
import clerkWebhook from "./controllers/clerk.js";
import { prisma } from "./configs/prisma.js";

const app = express();

// Middleware
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

app.post('/api/clerk',express.raw({ type: 'application/json' }),clerkWebhook)

app.use(express.json());
app.use(clerkMiddleware())

app.post('/api/users/sync', async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const clerkUser = await clerkClient.users.getUser(userId);

        const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? '';
        const firstName = clerkUser.firstName ?? '';
        const lastName = clerkUser.lastName ?? '';
        const name = `${firstName} ${lastName}`.trim() || clerkUser.username || 'Unknown User';
        const image = clerkUser.imageUrl ?? '';

        const user = await prisma.user.upsert({
            where: { id: userId },
            update: { email, name, image },
            create: { id: userId, email, name, image },
        });

        return res.json({ message: 'User synced', userId: user.id });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ message: `User sync failed: ${message}` });
    }
});

const PORT = Number(process.env.PORT) || 5001;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});



const server = app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
}); 

const checkDatabaseConnection = async () => {
    try {
        await prisma.$queryRawUnsafe("SELECT 1");
        console.log("Database connected to Neon successfully.");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Database connection failed:", message);
    }
};

checkDatabaseConnection();

server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Set a different PORT in your .env (example: PORT=5001).`);
        process.exit(1);
    }

    console.error('Failed to start server:', error.message);
    process.exit(1);
});