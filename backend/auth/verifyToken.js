// Import necessary modules
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Doctor from "../models/DoctorSchema.js";
import User from "../models/UserSchema.js";
import { mockStore } from "../mockStore.js";

export const authenticate = async (req, res, next) => {
  // Get token from headers
  const authToken = req.headers.authorization;

  // Check if token exists
  if (!authToken || !authToken.startsWith("Bearer")) {
    return res
      .status(401)
      .json({ success: false, message: "No token, authorization denied" });
  }

  try {
    // Extract token string and decode it
    const token = authToken.split(" ")[1];
    const secret = process.env.JWT_SECRET_KEY || "aimedlab-default-jwt-secret-key-2024";
    const decoded = jwt.verify(token, secret);

    // Attach decoded user information to the request object
    req.userId = decoded.id;
    req.role = decoded.role;

    // Check token expiration
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ message: "Token is expired" });
    }

    // Check if the user is a doctor and attach doctorId to the request object
    if (req.role === "doctor") {
      let doctor = null;
      if (mongoose.connection.readyState === 1) {
        try {
          doctor = await Doctor.findById(req.userId);
        } catch (dbErr) {
          console.warn("DB findById doctor in auth failed:", dbErr.message);
        }
      }
      if (!doctor) {
        doctor = mockStore.getDoctorById(req.userId);
      }
      if (!doctor) {
        // Allow using userId as doctorId fallback if user is recognized
        req.doctorId = req.userId;
      } else {
        req.doctorId = doctor._id;
      }
    }

    next(); // Call next middleware
  } catch (error) {
    // Handle token verification errors
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const restrict = (roles) => async (req, res, next) => {
  const userId = req.userId;

  try {
    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const patient = await User.findById(userId);
        const doctor = await Doctor.findById(userId);
        if (patient) user = patient;
        else if (doctor) user = doctor;
      } catch (dbErr) {
        console.warn("DB findById in restrict failed:", dbErr.message);
      }
    }

    if (!user) {
      user = mockStore.getUserById(userId) || mockStore.getDoctorById(userId);
    }

    const effectiveRole = user?.role || req.role;

    if (!effectiveRole || !roles.includes(effectiveRole)) {
      return res
        .status(401)
        .json({ success: false, message: "You are not authorized" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid user ID" });
  }
};
