import User from "../models/UserSchema.js";
import Doctor from "../models/DoctorSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  generateId,
  isDbConnected,
  memoryStore,
  sanitizeDoc,
} from "../db/memoryStore.js";

const getJwtSecret = () => process.env.JWT_SECRET_KEY || "ai_medlab_dev_secret";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    getJwtSecret(),
    {
      expiresIn: "15d",
    }
  );
};

export const register = async (req, res) => {
  const { email, password, name, role = "patient", photo, gender } = req.body;

  try {
    if (!isDbConnected()) {
      const existing =
        role === "doctor"
          ? memoryStore.doctors.find((d) => d.email === email)
          : memoryStore.users.find((u) => u.email === email);

      if (existing) {
        return res.status(400).json({ message: "User already exist" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);

      const newUser = {
        _id: generateId(),
        name,
        email,
        password: hashPassword,
        photo: photo || "/img/team-4.jpeg",
        gender: gender && gender !== "select" ? gender : "other",
        role: role === "select" ? "patient" : role,
        appointments: [],
        ...(role === "doctor"
          ? {
              isApproved: "approved",
              ticketPrice: 100,
              specialization: "General Physician",
              qualifications: [],
              experiences: [],
              timeSlots: [],
              reviews: [],
              averageRating: 4.5,
              totalRating: 0,
            }
          : {}),
      };

      if (newUser.role === "doctor") {
        memoryStore.doctors.push(newUser);
      } else {
        memoryStore.users.push(newUser);
      }

      return res
        .status(200)
        .json({ success: true, message: "User Successfully created" });
    }

    let user = null;

    if (role === "patient") {
      user = await User.findOne({ email });
    } else if (role === "doctor") {
      user = await Doctor.findOne({ email });
    }

    if (user) {
      return res.status(400).json({ message: "User already exist" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    if (role === "patient" || role === "admin" || role === "assistant") {
      user = new User({
        name,
        email,
        password: hashPassword,
        photo,
        gender,
        role: role === "assistant" ? "patient" : role,
      });
    }

    if (role === "doctor") {
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
    res
      .status(200)
      .json({ success: true, message: "User Successfully created" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Internal server error, Try again" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = null;

    if (!isDbConnected()) {
      const patient = memoryStore.users.find((u) => u.email === email);
      const doctor = memoryStore.doctors.find((d) => d.email === email);
      if (patient) user = patient;
      if (doctor) user = doctor;

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res
          .status(404)
          .json({ status: false, message: "Invalid Credentials, try again" });
      }

      const token = generateToken(user);
      const { role, appointments, ...rest } = sanitizeDoc(user);
      return res.status(200).json({
        status: true,
        message: "Successfully login",
        token,
        data: { ...rest },
        role,
      });
    }

    const patient = await User.findOne({ email });
    const doctor = await Doctor.findOne({ email });
    const admin = await User.findOne({ email, role: "admin" });

    if (patient) user = patient;
    if (doctor) user = doctor;
    if (admin) user = admin;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res
        .status(404)
        .json({ status: false, message: "Invalid Credentials, try again" });
    }

    const token = generateToken(user);
    const { password: userPassword, role, appointments, ...rest } = user._doc;
    res.status(200).json({
      status: true,
      message: "Successfully login",
      token,
      data: { ...rest },
      role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Failed to login" });
  }
};
