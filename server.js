import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

import authRoute from "./backend/Routes/auth.js";
import userRoute from "./backend/Routes/user.js";
import doctorRoute from "./backend/Routes/doctor.js";
import reviewRoute from "./backend/Routes/review.js";
import bookingRoute from "./backend/Routes/booking.js";
import diseaseRoute from "./backend/Routes/disease.js";
import adminRoute from "./backend/Routes/admin.js";
import contactRoute from "./backend/Routes/contact.js";
import forgotPassRoute from "./backend/Routes/forgot-password.js";
import healthRoute from "./backend/Routes/healthPredict.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Connect to MongoDB if MONGO_URL is provided
mongoose.set("strictQuery", false);
mongoose.set("bufferCommands", false);
if (process.env.MONGO_URL) {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection failed:", err.message));
} else {
  console.log("No MONGO_URL provided, running with in-memory/fallback mode");
}

// Ensure uploads folder exists
const uploadsDir = path.resolve("./backend/public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Static uploads
app.use("/uploads", express.static(uploadsDir));
app.use("/public/uploads", express.static(uploadsDir));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "AI-MedLab" });
});

// API Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/doctors", doctorRoute);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/bookings", bookingRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1", diseaseRoute);
app.use("/api/v1", contactRoute);
app.use("/api/v1", forgotPassRoute);
app.use("/api/v1", healthRoute);

// Frontend integration: Vite middleware in development, static build in production
async function start() {
  const isProduction = process.env.NODE_ENV === "production";
  const frontendDir = path.resolve(__dirname, "frontend");
  const distDir = path.resolve(__dirname, "dist");

  if (!isProduction && fs.existsSync(frontendDir)) {
    const vite = await createViteServer({
      root: frontendDir,
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api")) return next();

      try {
        const indexPath = path.resolve(frontendDir, "index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production static serving
    const servePath = fs.existsSync(distDir) ? distDir : path.resolve(frontendDir, "dist");
    app.use(express.static(servePath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(servePath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI-MedLab server running at http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});
