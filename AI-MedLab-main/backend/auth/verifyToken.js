import jwt from "jsonwebtoken";
import Doctor from "../models/DoctorSchema.js";
import User from "../models/UserSchema.js";
import { isDbConnected, memoryStore } from "../db/memoryStore.js";

const getJwtSecret = () => process.env.JWT_SECRET_KEY || "ai_medlab_dev_secret";

export const authenticate = async (req, res, next) => {
  const authToken = req.headers.authorization;

  if (!authToken || !authToken.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token, authorization denied" });
  }

  try {
    const token = authToken.split(" ")[1];
    if (!token || token === "null" || token === "undefined") {
      return res
        .status(401)
        .json({ success: false, message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    req.userId = decoded.id;
    req.role = decoded.role;
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ message: "Token is expired" });
    }

    if (req.role === "doctor") {
      const doctor = isDbConnected()
        ? await Doctor.findById(req.userId)
        : memoryStore.doctors.find((d) => d._id === req.userId);
      if (!doctor) {
        return res
          .status(404)
          .json({ success: false, message: "Doctor not found" });
      }
      req.doctorId = doctor._id;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const restrict = (roles) => async (req, res, next) => {
  const userId = req.userId;

  try {
    let user;

    if (isDbConnected()) {
      const patient = await User.findById(userId);
      const doctor = await Doctor.findById(userId);
      if (patient) user = patient;
      if (doctor) user = doctor;
    } else {
      user =
        memoryStore.users.find((u) => u._id === userId) ||
        memoryStore.doctors.find((d) => d._id === userId);
    }

    if (!user || !roles.includes(user.role)) {
      return res
        .status(401)
        .json({ success: false, message: "You are not authorized" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid user ID" });
  }
};
