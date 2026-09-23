import mongoose from "mongoose";
import Booking from "../models/BookingSchema.js";
import Doctor from "../models/DoctorSchema.js";
import { mockStore, fallbackDoctors } from "../mockStore.js";

export const updateDoctor = async (req, res) => {
  const id = req.params.id;
  try {
    let updatedDoctor = null;
    if (mongoose.connection.readyState === 1) {
      try {
        updatedDoctor = await Doctor.findByIdAndUpdate(
          id,
          { $set: req.body },
          { new: true }
        );
      } catch (dbErr) {
        console.warn("Doctor DB update failed:", dbErr.message);
      }
    }

    if (!updatedDoctor) {
      updatedDoctor = mockStore.updateDoctor(id, req.body);
    }

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating Doctor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update doctor",
      error: error.message,
    });
  }
};

export const deleteDoctor = async (req, res) => {
  const id = req.params.id;
  try {
    let deleted = false;
    if (mongoose.connection.readyState === 1) {
      try {
        await Doctor.findByIdAndDelete(id);
        deleted = true;
      } catch (dbErr) {
        console.warn("Doctor DB delete failed:", dbErr.message);
      }
    }

    if (!deleted) {
      mockStore.deleteDoctor(id);
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

export const getSingleDoctor = async (req, res) => {
  const id = req.params.id;
  try {
    let doctor = null;
    if (mongoose.connection.readyState === 1) {
      try {
        doctor = await Doctor.findById(id)
          .populate("reviews")
          .select("-password");
      } catch (dbErr) {
        console.warn("DB query failed, checking mock store:", dbErr.message);
      }
    }

    if (!doctor) {
      doctor = mockStore.getDoctorById(id);
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const raw = doctor._doc ? { ...doctor._doc } : { ...doctor };
    const { password, ...rest } = raw;

    res.status(200).json({
      success: true,
      message: "Doctor Found",
      data: rest,
    });
  } catch (error) {
    const fallback = mockStore.getDoctorById(id);
    if (fallback) {
      return res.status(200).json({
        success: true,
        message: "Doctor Found",
        data: fallback,
      });
    }
    res.status(404).json({
      success: false,
      message: "Failed to find Doctor",
    });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const { query } = req.query;
    let doctors = [];

    if (mongoose.connection.readyState === 1) {
      try {
        if (query) {
          doctors = await Doctor.find({
            isApproved: "approved",
            $or: [
              { name: { $regex: query, $options: "i" } },
              { specialization: { $regex: query, $options: "i" } },
            ],
          }).select("-password");
        } else {
          doctors = await Doctor.find({ isApproved: "approved" }).select(
            "-password"
          );
        }
      } catch (dbErr) {
        console.warn("DB fetch failed, falling back to mock doctors:", dbErr.message);
      }
    }

    if (!doctors || doctors.length === 0) {
      doctors = mockStore.getAllDoctors(query);
    }

    res.status(200).json({
      success: true,
      message: "Doctors Found",
      data: doctors,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: "Doctors Found",
      data: mockStore.getAllDoctors(req.query?.query),
    });
  }
};

export const getDoctorProfile = async (req, res) => {
  const doctorId = req.doctorId || req.userId;

  try {
    let doctor = null;
    let appointments = [];

    if (mongoose.connection.readyState === 1) {
      try {
        doctor = await Doctor.findById(doctorId);
        if (doctor) {
          appointments = await Booking.find({ doctor: doctorId });
        }
      } catch (dbErr) {
        console.warn("DB getDoctorProfile failed:", dbErr.message);
      }
    }

    if (!doctor) {
      doctor = mockStore.getDoctorById(doctorId);
      appointments = doctor?.appointments || [];
    }

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    const raw = doctor._doc ? { ...doctor._doc } : { ...doctor };
    const { password, ...rest } = raw;

    res.status(200).json({
      success: true,
      message: "Profile info is getting",
      data: { ...rest, appointments },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong, cannot get this",
      error: error.message,
    });
  }
};
