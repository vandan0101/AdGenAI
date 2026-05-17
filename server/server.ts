import "./configs/instrument.mjs"
import "dotenv/config";
import http from "node:http";
import express, { Request, Response } from 'express';
import cors from "cors";
import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express'
import clerkWebhook from "./controllers/clerk.js";
import { prisma } from "./configs/prisma.js";
import * as Sentry from "@sentry/node"
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectRoutes.js";

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

const isPortAlreadyServing = async (port: number) => {
    return await new Promise<boolean>((resolve) => {
        const request = http.get(
            {
                hostname: "127.0.0.1",
                port,
                path: "/",
                timeout: 1000,
            },
            (response) => {
                response.resume();
                resolve(true);
            },
        );

        request.on("timeout", () => {
            request.destroy();
            resolve(false);
        });

        request.on("error", () => {
            resolve(false);
        });
    });
};

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});
app.use('/api/user',userRouter)
app.use('/api/project',projectRouter)

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);


const server = app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
}); 

server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        void (async () => {
            if (await isPortAlreadyServing(PORT)) {
                console.log(`Server is already running at http://localhost:${PORT}`);
                process.exit(0);
            }

            console.error(`Port ${PORT} is already in use. Set a different PORT in your .env (example: PORT=5001).`);
            process.exit(1);
        })();
        return;
    }

    console.error('Failed to start server:', error.message);
    process.exit(1);
});