/**
 * Main Express application
 */
import cors from "cors";
import "dotenv/config";
import express, {
  type Express,
  NextFunction,
  type Request,
  Response,
} from "express";

import {errorHandler} from "./middlewares/errorHandler.js";
import analyzeRoutes from "./routes/analyze.routes.js";
import jdRoutes from "./routes/jd.routes.js";
import resumeRoutes from "./routes/resume.routes.js";

const app: Express = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || ["*"];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Allow all origins if CORS_ORIGINS is set to '*'
    if (allowedOrigins.includes("*")) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // For Chrome extensions, check if origin starts with chrome-extension://
    if (origin.startsWith("chrome-extension://")) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({limit: "10mb"}));
app.use(express.urlencoded({extended: true, limit: "10mb"}));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api", jdRoutes);
app.use("/api", resumeRoutes);
app.use("/api", analyzeRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
    statusCode: 404,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server (skip if in test environment)
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.info(`🚀 Server running on port ${PORT}`);
    console.info(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    console.info(`🔗 Health check: http://localhost:${PORT}/health`);

    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️  WARNING: OPENAI_API_KEY is not set");
    }
  });
}

export default app;
