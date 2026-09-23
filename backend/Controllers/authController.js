import mongoose from "mongoose";
import User from "../models/UserSchema.js";
import Doctor from "../models/DoctorSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { mockStore } from "../mockStore.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET_KEY || "aimedlab-default-jwt-secret-key-2024",
    {
      expiresIn: "15d",
    }
  );
};

export const register = async (req, res) => {
  const { email, password, name, role, photo, gender } = req.body;

  try {
    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        if (role === "patient") {
          user = await User.findOne({ email });
        } else if (role === "doctor") {
          user = await Doctor.findOne({ email });
        }
      } catch (dbErr) {
        console.warn("DB query in register failed:", dbErr.message);
      }
    }

    if (!user) {
      user = mockStore.getUserByEmail(email) || mockStore.getDoctorByEmail(email);
    }

    // check if user exist
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    if (mongoose.connection.readyState === 1) {
      try {
        if (role === "patient") {
          user = new User({
            name,
            email,
            password: hashPassword,
            photo,
            gender,
            role,
          });
        } else if (role === "doctor") {
          user = new Doctor({
            name,
            email,
            password: hashPassword,
            photo,
            gender,
            role,
          });
        }
        await user.save();
      } catch (dbErr) {
        console.warn("Mongoose save failed, saving to in-memory store:", dbErr.message);
        user = null;
      }
    }

    if (!user) {
      if (role === "doctor") {
        mockStore.createDoctor({
          name,
          email,
          password: hashPassword,
          photo,
          gender,
          role,
        });
      } else {
        mockStore.createUser({
          name,
          email,
          password: hashPassword,
          photo,
          gender,
          role: role || "patient",
        });
      }
    }

    res
      .status(200)
      .json({ success: true, message: "User Successfully created" });
  } catch (error) {
    console.error("Register error:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error, Try again" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const patient = await User.findOne({ email });
        const doctor = await Doctor.findOne({ email });
        const admin = await User.findOne({ email, role: "admin" });

        if (patient) user = patient;
        else if (doctor) user = doctor;
        else if (admin) user = admin;
      } catch (dbErr) {
        console.warn("DB query in login failed:", dbErr.message);
      }
    }

    if (!user) {
      user = mockStore.getUserByEmail(email) || mockStore.getDoctorByEmail(email);
    }

    // check if user exist
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid Credentials, try again" });
    }

    // get token
    const token = generateToken(user);
    const rawData = user._doc ? { ...user._doc } : { ...user };
    const { password: userPassword, role, appointments, ...rest } = rawData;

    res.status(200).json({
      status: true,
      message: "Successfully login",
      token,
      data: { ...rest },
      role: role || user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ status: false, message: "Failed to login" });
  }
};
