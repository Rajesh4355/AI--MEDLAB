import nodemailer from "nodemailer";
import dotEnv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/UserSchema.js";
import { isDbConnected, memoryStore } from "../db/memoryStore.js";

const router = express.Router();
dotEnv.config();

const getJwtSecret = () => process.env.JWT_SECRET_KEY || "ai_medlab_dev_secret";

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = isDbConnected()
      ? await User.findOne({ email })
      : memoryStore.users.find((u) => u.email === email);

    if (!user) {
      return res.send({ status: "User not exists." });
    }

    const token = jwt.sign({ id: user._id }, getJwtSecret(), {
      expiresIn: "1d",
    });

    const smtpUser = process.env.EMAIL_USER || process.env.USER;
    const smtpPass = process.env.EMAIL_PASS || process.env.APP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn(
        "SMTP credentials not configured — reset token generated for",
        email
      );
      return res.status(200).json({
        message: "Success",
        resetUrl: `/reset-password/${user._id}/${token}`,
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    const baseUrl =
      process.env.CLIENT_SITE_URL || `${req.protocol}://${req.get("host")}`;
    const mailOptions = {
      from: {
        name: "AI-MedLab",
        address: smtpUser,
      },
      to: email,
      subject: "Sending Email for Reset Password",
      text: `${baseUrl.replace(/\/$/, "")}/reset-password/${user._id}/${token}`,
    };
    transporter.sendMail(mailOptions, function (error) {
      if (error) {
        res.status(500).json({ message: "Failed to send email" });
      } else {
        res.status(200).json({ message: "Success" });
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to process forgot password" });
  }
});

router.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  jwt.verify(token, getJwtSecret(), async (err) => {
    if (err) {
      return res.json({ message: "Error with token" });
    }
    try {
      const hash = await bcrypt.hash(password, 10);
      if (!isDbConnected()) {
        const user = memoryStore.users.find((u) => u._id === id);
        if (user) user.password = hash;
        return res.send({ message: "Success" });
      }
      await User.findOneAndUpdate({ _id: id }, { password: hash });
      res.send({ message: "Success" });
    } catch (error) {
      res.send({ message: error.message });
    }
  });
});

export default router;
