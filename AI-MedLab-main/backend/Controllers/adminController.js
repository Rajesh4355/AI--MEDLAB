import User from "../models/UserSchema.js";
import Doctor from "../models/DoctorSchema.js";
import Booking from "../models/BookingSchema.js";
import { isDbConnected, memoryStore, sanitizeDoc } from "../db/memoryStore.js";

export const getAllUsers = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        message: "Users Found",
        data: memoryStore.users.map(sanitizeDoc),
      });
    }

    const users = await User.find({}).select("-password");
    res.status(200).json({
      success: true,
      message: "Users Found",
      data: users,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "No Users found",
    });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!isDbConnected()) {
      const idx = memoryStore.users.findIndex((u) => u._id === id);
      if (idx === -1) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      memoryStore.users.splice(idx, 1);
      return res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteDoctorById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!isDbConnected()) {
      const idx = memoryStore.doctors.findIndex((d) => d._id === id);
      if (idx === -1) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      memoryStore.doctors.splice(idx, 1);
      return res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    }

    const deletedUser = await Doctor.findByIdAndDelete(id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        message: "Doctors Found",
        data: memoryStore.doctors.map(sanitizeDoc),
      });
    }

    const doctors = await Doctor.find({}).select("-password");
    res.status(200).json({
      success: true,
      message: "Doctors Found",
      data: doctors,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "No Doctors found",
    });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        counts: memoryStore.bookings.length,
        success: true,
        message: "Bookings Found",
        data: memoryStore.bookings,
      });
    }

    const bookings = await Booking.find({});

    res.status(200).json({
      counts: bookings.length,
      success: true,
      message: "Bookings Found",
      data: bookings,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "No Bookings Found",
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
    if (!isDbConnected()) {
      const doctor = memoryStore.doctors.find((d) => d._id === id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      doctor.isApproved = isApproved;
      return res
        .status(200)
        .json({
          message: "Approval status updated successfully",
          doctor: sanitizeDoc(doctor),
        });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isApproved = isApproved;
    await doctor.save();

    res
      .status(200)
      .json({ message: "Approval status updated successfully", doctor });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
