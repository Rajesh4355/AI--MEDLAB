import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoute from "./Routes/auth.js";
import userRoute from "./Routes/user.js";
import doctorRoute from "./Routes/doctor.js";
import reviewRoute from "./Routes/review.js";
import bookingRoute from "./Routes/booking.js";
import diseaseRoute from "./Routes/disease.js";
import adminRoute from "./Routes/admin.js";
import contactRoute from "./Routes/contact.js";
import forgotPassRoute from "./Routes/forgot-password.js";
import healthRoute from "./Routes/healthPredict.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

const frontendDistPath = path.resolve(__dirname, "../frontend/dist");

const app = express();
const port = Number(process.env.PORT) || 3000;

const corsOptions = {
  origin: true,
  credentials: true,
};

// Database connection (fail fast if offline; in-memory store handles fallback)
mongoose.set("strictQuery", false);
mongoose.set("bufferCommands", false);

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn(
      "MongoDB URI not configured — running with in-memory fallback store"
    );
    return;
  }
  try {
    await mongoose.connect(mongoUri);
    console.log("Mongoose connected");
  } catch (error) {
    console.warn(
      "MongoDB not connected — running with in-memory fallback store"
    );
  }
};

// Middleware
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());
app.use(cors(corsOptions));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/v1/public-config", (req, res) => {
  res.json({
    cloudName: process.env.VITE_CLOUD_NAME || "",
    uploadPreset: process.env.VITE_UPLOAD_PRESET || "",
  });
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/doctors", doctorRoute);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/bookings", bookingRoute);
app.use("/api/v1", diseaseRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1", contactRoute);
app.use("/api/v1", forgotPassRoute);
app.use("/api/v1", healthRoute);

// Express error middleware for database offline fallback
app.use((err, req, res, next) => {
  if (
    err.name === "MongooseError" ||
    err.name === "MongoNetworkError" ||
    (err.message && err.message.includes("buffering timed out"))
  ) {
    console.warn("[AI Studio] Database offline — returning mock empty response");
    if (req.method === "GET") {
      return res.json(
        req.path.endsWith("s") || req.path.endsWith("s/") ? [] : {}
      );
    }
    return res
      .status(503)
      .json({ error: "Service temporarily unavailable (database offline)" });
  }
  next(err);
});

// Serve built Vite SPA after API routes
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API route not found" });
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  connectDB();
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
