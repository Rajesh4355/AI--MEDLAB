import User from "../models/UserSchema.js";
import Booking from "../models/BookingSchema.js";
import Doctor from "../models/DoctorSchema.js";
import mongoose from "mongoose";
import { mockStore } from "../mockStore.js";

export const updateUser = async (req, res) => {
  const id = req.params.id;
  try {
    let updatedUser = null;
    if (mongoose.connection.readyState === 1) {
      try {
        updatedUser = await User.findByIdAndUpdate(
          id,
          { $set: req.body },
          { new: true }
        );
      } catch (dbErr) {
        console.warn("DB update failed:", dbErr.message);
      }
    }

    if (!updatedUser) {
      updatedUser = mockStore.updateUser(id, req.body);
    }

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update",
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    let deleted = false;
    if (mongoose.connection.readyState === 1) {
      try {
        const u = await User.findByIdAndDelete(id);
        if (u) deleted = true;
      } catch (dbErr) {
        console.warn("DB delete failed:", dbErr.message);
      }
    }

    if (!deleted) {
      deleted = mockStore.deleteUser(id);
    }

    res.status(200).json({
      success: true,
      message: "Successfully deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};

export const getSingleUser = async (req, res) => {
  const id = req.params.id;
  try {
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(id).select("-password");
      } catch (dbErr) {
        console.warn("DB find single user failed:", dbErr.message);
      }
    }

    if (!user) {
      user = mockStore.getUserById(id);
      if (user) {
        const { password, ...rest } = user;
        user = rest;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Failed to find user",
      });
    }

    res.status(200).json({
      success: true,
      message: "User Found",
      data: user,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Failed to find user",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    let users = [];
    if (mongoose.connection.readyState === 1) {
      try {
        users = await User.find({}).select("-password");
      } catch (dbErr) {
        console.warn("DB find all users failed:", dbErr.message);
      }
    }

    if (!users || users.length === 0) {
      users = mockStore.getAllUsers();
    }

    res.status(200).json({
      success: true,
      message: "Users Found",
      data: users,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: "Users Found",
      data: mockStore.getAllUsers(),
    });
  }
};

export const getUserProfile = async (req, res) => {
  const userId = req.userId;

  try {
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(userId);
      } catch (dbErr) {
        console.warn("DB getUserProfile failed:", dbErr.message);
      }
    }

    if (!user) {
      user = mockStore.getUserById(userId);
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const rawData = user._doc ? { ...user._doc } : { ...user };
    const { password, ...rest } = rawData;

    res.status(200).json({
      success: true,
      message: "Profile info is getting",
      data: { ...rest },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong, cannot get this",
    });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    let doctors = [];
    if (mongoose.connection.readyState === 1) {
      try {
        const bookings = await Booking.find({ user: req.userId });
        const doctorIds = bookings.map((el) => el.doctor.id || el.doctor);
        doctors = await Doctor.find({ _id: { $in: doctorIds } }).select(
          "-password"
        );
      } catch (dbErr) {
        console.warn("DB getMyAppointments failed:", dbErr.message);
      }
    }

    if (!doctors || doctors.length === 0) {
      const userBookings = mockStore.getBookingsByUserId(req.userId);
      doctors = userBookings.map(b => b.doctor);
    }

    res.status(200).json({
      success: true,
      message: "Appointments are getting",
      data: doctors,
    });
  } catch (error) {
    const userBookings = mockStore.getBookingsByUserId(req.userId);
    res.status(200).json({
      success: true,
      message: "Appointments are getting",
      data: userBookings.map(b => b.doctor),
    });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, ...appointmentData } = req.body;
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    let doctor = null;
    if (mongoose.connection.readyState === 1) {
      try {
        doctor = await Doctor.findById(doctorId);
      } catch (dbErr) {
        console.warn("DB findById doctor failed:", dbErr.message);
      }
    }

    if (!doctor) {
      doctor = mockStore.getDoctorById(doctorId);
    }

    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: "This Doctor is not available now",
      });
    }

    const appointment = {
      patientName: appointmentData.patientName,
      patientGender: appointmentData.patientGender,
      payment: appointmentData.payment || "paid",
      price: appointmentData.price || String(doctor.ticketPrice || 100),
      bookedOn: appointmentData.bookedOn || new Date().toISOString(),
      testName: appointmentData.testName || "Medical Consultation",
      testResult: appointmentData.testResult || "",
    };

    if (doctor.appointments) {
      doctor.appointments.push(appointment);
    } else {
      doctor.appointments = [appointment];
    }

    if (mongoose.connection.readyState === 1 && typeof doctor.save === "function") {
      try {
        await doctor.save();
      } catch (saveErr) {
        console.warn("Doctor save to DB failed:", saveErr.message);
      }
    }

    // Also register in mockStore
    mockStore.createBooking({
      doctorId,
      userId: req.userId || "anonymous_user",
      ticketPrice: doctor.ticketPrice,
    });

    return res.status(200).json({
      success: true,
      data: doctor,
      message: "Appointment booking done",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
