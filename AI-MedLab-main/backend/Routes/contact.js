import nodemailer from "nodemailer";
import dotEnv from "dotenv";
import express from "express";

const router = express.Router();
dotEnv.config();

router.post("/contact", async (req, res) => {
  const { email, subject, message } = req.body;
  const smtpUser = process.env.EMAIL_USER || process.env.USER;
  const smtpPass = process.env.EMAIL_PASS || process.env.APP_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn("SMTP credentials not configured — logging contact message:", {
      email,
      subject,
    });
    return res
      .status(200)
      .json({ message: "Message received (demo mode — SMTP not configured)" });
  }

  try {
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

    let info = await transporter.sendMail({
      from: {
        name: "AI-MedLab",
        address: smtpUser,
      },
      to: smtpUser,
      subject: subject,
      text: `Email: ${email}\n\nMessage: ${message}`,
    });

    res.status(200).json({ info, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
});

export default router;
