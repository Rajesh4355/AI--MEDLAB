import User from "../models/UserSchema.js";
import Doctor from "../models/DoctorSchema.js";
import Booking from "../models/BookingSchema.js";
import Stripe from "stripe";
import mongoose from "mongoose";
import { mockStore } from "../mockStore.js";

export const getCheckoutSession = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    let doctor = null;
    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        doctor = await Doctor.findById(doctorId);
        user = await User.findById(req.userId);
      } catch (dbErr) {
        console.warn("DB query failed in checkout session:", dbErr.message);
      }
    }

    if (!doctor) {
      doctor = mockStore.getDoctorById(doctorId);
    }
    if (!user) {
      user = mockStore.getUserById(req.userId) || {
        _id: req.userId,
        email: "patient@aimedlab.com",
        name: "Patient",
      };
    }

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const ticketPrice = doctor.ticketPrice || 100;

    // Check if Stripe key is provided and valid
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("your_stripe")) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const clientSiteUrl = process.env.CLIENT_SITE_URL || "";

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          success_url: `${clientSiteUrl}/checkout-success`,
          cancel_url: `${req.protocol}://${req.get("host")}/doctors/${doctor.id || doctor._id}`,
          customer_email: user.email,
          client_reference_id: doctorId,
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: ticketPrice * 100,
                product_data: {
                  name: doctor.name,
                  description: doctor.bio || "Doctor Appointment",
                  images: doctor.photo ? [doctor.photo] : [],
                },
              },
              quantity: 1,
            },
          ],
        });

        if (mongoose.connection.readyState === 1) {
          try {
            const booking = new Booking({
              doctor: doctor._id,
              user: user._id,
              ticketPrice,
              session: session.id,
            });
            await booking.save();
          } catch (bErr) {
            console.warn("Could not save booking to MongoDB:", bErr.message);
          }
        }

        mockStore.createBooking({
          doctorId,
          userId: user._id,
          ticketPrice,
          session,
        });

        return res.status(200).json({ success: true, message: "Successfully created checkout session", session });
      } catch (stripeErr) {
        console.warn("Stripe checkout failed, using simulated checkout fallback:", stripeErr.message);
      }
    }

    // Simulated Checkout fallback for testing/demo
    const mockSession = {
      id: "cs_simulated_" + Date.now(),
      url: "/checkout-success",
      payment_status: "paid",
      amount_total: ticketPrice * 100,
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const booking = new Booking({
          doctor: doctor._id,
          user: user._id,
          ticketPrice,
          session: mockSession.id,
        });
        await booking.save();
      } catch (bErr) {
        console.warn("Could not save booking to MongoDB:", bErr.message);
      }
    }

    mockStore.createBooking({
      doctorId,
      userId: user._id,
      ticketPrice,
      session: mockSession,
    });

    res.status(200).json({
      success: true,
      message: "Appointment confirmed",
      session: mockSession,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ success: false, message: "Error creating checkout session" });
  }
};
