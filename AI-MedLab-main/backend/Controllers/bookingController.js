import crypto from "crypto";
import Razorpay from "razorpay";
import User from "../models/UserSchema.js";
import Doctor from "../models/DoctorSchema.js";
import Booking from "../models/BookingSchema.js";
import { generateId, isDbConnected, memoryStore } from "../db/memoryStore.js";

export const getCheckoutSession = async (req, res) => {
  try {
    let doctor;
    let user;

    if (!isDbConnected()) {
      doctor = memoryStore.doctors.find((d) => d._id === req.params.doctorId);
      user = memoryStore.users.find((u) => u._id === req.userId);
    } else {
      doctor = await Doctor.findById(req.params.doctorId);
      user = await User.findById(req.userId);
    }

    if (!doctor || !user) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor or user not found" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const amountInPaise = Math.round((Number(doctor.ticketPrice) || 100) * 100);

    if (!keyId || !keySecret) {
      const booking = {
        _id: generateId(),
        doctor: { _id: doctor._id, name: doctor.name },
        user: { _id: user._id, name: user.name, email: user.email },
        ticketPrice: String(doctor.ticketPrice || 100),
        status: "approved",
        isPaid: true,
        createdAt: new Date().toISOString(),
      };
      if (!isDbConnected()) {
        memoryStore.bookings.push(booking);
      } else {
        await new Booking({
          doctor: doctor._id,
          user: user._id,
          ticketPrice: doctor.ticketPrice || 100,
          session: booking._id,
        }).save();
      }
      return res.status(200).json({
        success: true,
        demoMode: true,
        message: "Successfully paid (demo mode)",
        session: { id: booking._id, url: "/checkout-success" },
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${doctor._id}_${Date.now()}`.slice(0, 40),
      notes: {
        doctorId: String(doctor._id),
        userId: String(user._id),
      },
    });

    if (!isDbConnected()) {
      memoryStore.bookings.push({
        _id: generateId(),
        doctor: { _id: doctor._id, name: doctor.name },
        user: { _id: user._id, name: user.name, email: user.email },
        ticketPrice: String(doctor.ticketPrice || 100),
        status: "pending",
        isPaid: false,
        session: order.id,
        createdAt: new Date().toISOString(),
      });
    } else {
      const booking = new Booking({
        doctor: doctor._id,
        user: user._id,
        ticketPrice: doctor.ticketPrice || 100,
        status: "pending",
        isPaid: false,
        session: order.id,
      });
      await booking.save();
    }

    res.status(200).json({
      success: true,
      demoMode: false,
      message: "Razorpay order created",
      keyId,
      order,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        bio: doctor.bio || "Medical Consultation",
      },
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone ? String(user.phone) : "",
      },
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error creating Razorpay order" });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(400).json({
        success: false,
        message: "Razorpay secret key is not configured",
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment verification fields",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    if (!isDbConnected()) {
      const booking = memoryStore.bookings.find(
        (b) => b.session === razorpay_order_id
      );
      if (booking) {
        booking.isPaid = true;
        booking.status = "approved";
        booking.paymentId = razorpay_payment_id;
      }
    } else {
      await Booking.findOneAndUpdate(
        { session: razorpay_order_id },
        { $set: { isPaid: true, status: "approved" } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      redirectUrl: "/checkout-success",
    });
  } catch (err) {
    console.error("Razorpay verification error:", err);
    res.status(500).json({
      success: false,
      message: "Error verifying Razorpay payment",
    });
  }
};
