import nodemailer from "nodemailer";
import dotEnv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/UserSchema.js";
import mongoose from "mongoose";
import { mockStore } from "../mockStore.js";

const router = express.Router();
dotEnv.config();

// POST route for forgot password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  let user = null;
  if (mongoose.connection.readyState === 1) {
    try {
      user = await User.findOne({ email });
    } catch (dbErr) {
      console.warn("DB find failed in forgot-password:", dbErr.message);
    }
  }

  if (!user) {
    user = mockStore.getUserByEmail(email) || mockStore.getDoctorByEmail(email);
  }

  if (!user) {
    return res.status(404).json({ status: "User not exists." });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY || "aimedlab-default-jwt-secret-key-2024", {
    expiresIn: "1d",
  });

  const resetUrl = `/reset-password/${user._id}/${token}`;

  if (process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USERNAME || process.env.USER,
          pass: process.env.EMAIL_PASSWORD || process.env.APP_PASS,
        },
      });

      const mailOptions = {
        from: {
          name: "AI-MedLab Support",
          address: process.env.EMAIL_USERNAME || process.env.USER,
        },
        to: email,
        subject: "Password Reset Link",
        text: `Click the link below to reset your password:\n${resetUrl}`,
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: "Success", resetUrl });
    } catch (e) {
      console.warn("Email sending failed in forgot-password:", e.message);
    }
  }

  return res.status(200).json({
    message: "Success",
    resetUrl,
    note: "Password reset link generated.",
  });
});

router.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    const secret = process.env.JWT_SECRET_KEY || "aimedlab-default-jwt-secret-key-2024";
    jwt.verify(token, secret);

    const hash = await bcrypt.hash(password, 10);

    if (mongoose.connection.readyState === 1) {
      try {
        await User.findOneAndUpdate({ _id: id }, { password: hash });
      } catch (dbErr) {
        console.warn("DB update failed in reset-password:", dbErr.message);
      }
    }

    mockStore.updateUser(id, { password: hash });
    mockStore.updateDoctor(id, { password: hash });

    return res.json({ message: "Success" });
  } catch (err) {
    return res.status(400).json({ message: "Error with token or reset failed" });
  }
});

export default router;
