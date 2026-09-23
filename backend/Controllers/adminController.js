import mongoose from "mongoose";
import User from "../models/UserSchema.js";
import Doctor from "../models/DoctorSchema.js";
import Booking from "../models/BookingSchema.js";
import { mockStore } from "../mockStore.js";

export const getAllUsers = async (req, res) => {
  try {
    let users = [];
    if (mongoose.connection.readyState === 1) {
      try {
        users = await User.find({}).select("-password");
      } catch (dbErr) {
        console.warn("Admin DB find users failed:", dbErr.message);
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
  } catch (err) {
    res.status(200).json({
      success: true,
      message: "Users Found",
      data: mockStore.getAllUsers(),
    });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const id = req.params.id;
    let deleted = false;
    if (mongoose.connection.readyState === 1) {
      try {
        const u = await User.findByIdAndDelete(id);
        if (u) deleted = true;
      } catch (dbErr) {
        console.warn("Admin DB delete user failed:", dbErr.message);
      }
    }

    if (!deleted) {
      deleted = mockStore.deleteUser(id);
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteDoctorById = async (req, res) => {
  try {
    const id = req.params.id;
    let deleted = false;
    if (mongoose.connection.readyState === 1) {
      try {
        const d = await Doctor.findByIdAndDelete(id);
        if (d) deleted = true;
      } catch (dbErr) {
        console.warn("Admin DB delete doctor failed:", dbErr.message);
      }
    }

    if (!deleted) {
      deleted = mockStore.deleteDoctor(id);
    }

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    let doctors = [];
    if (mongoose.connection.readyState === 1) {
      try {
        doctors = await Doctor.find({}).select("-password");
      } catch (dbErr) {
        console.warn("Admin DB find doctors failed:", dbErr.message);
      }
    }

    if (!doctors || doctors.length === 0) {
      doctors = mockStore.getAllDoctors();
    }

    res.status(200).json({
      success: true,
      message: "Doctors Found",
      data: doctors,
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      message: "Doctors Found",
      data: mockStore.getAllDoctors(),
    });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    let bookings = [];
    if (mongoose.connection.readyState === 1) {
      try {
        bookings = await Booking.find({});
      } catch (dbErr) {
        console.warn("Admin DB find bookings failed:", dbErr.message);
      }
    }

    if (!bookings || bookings.length === 0) {
      bookings = mockStore.getAllBookings();
    }

    res.status(200).json({
      counts: bookings.length,
      success: true,
      message: "Bookings Found",
      data: bookings,
    });
  } catch (err) {
    const bookings = mockStore.getAllBookings();
    res.status(200).json({
      counts: bookings.length,
      success: true,
      message: "Bookings Found",
      data: bookings,
    });
  }
};

export const updateDoctorApprovalStatus = async (req, res) => {
  const { id } = req.params;
  const { isApproved } = req.body;

  if (!["pending", "approved", "cancelled"].includes(isApproved)) {
    return res.status(400).json({ message: "Invalid approval status" });
  }

  try {
    let doctor = null;
    if (mongoose.connection.readyState === 1) {
      try {
        doctor = await Doctor.findById(id);
        if (doctor) {
          doctor.isApproved = isApproved;
          await doctor.save();
        }
      } catch (dbErr) {
        console.warn("DB update approval status failed:", dbErr.message);
      }
    }

    if (!doctor) {
      doctor = mockStore.updateDoctor(id, { isApproved });
    }

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({
      message: "Approval status updated successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
