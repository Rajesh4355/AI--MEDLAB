import Booking from "../models/BookingSchema.js";
import Doctor from "../models/DoctorSchema.js";
import { isDbConnected, memoryStore, sanitizeDoc } from "../db/memoryStore.js";

export const updateDoctor = async (req, res) => {
  const id = req.params.id;
  try {
    if (!isDbConnected()) {
      const idx = memoryStore.doctors.findIndex((d) => d._id === id);
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }
      memoryStore.doctors[idx] = { ...memoryStore.doctors[idx], ...req.body };
      return res.status(200).json({
        success: true,
        message: "Successfully updated",
        data: sanitizeDoc(memoryStore.doctors[idx]),
      });
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
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
    if (!isDbConnected()) {
      const idx = memoryStore.doctors.findIndex((d) => d._id === id);
      if (idx !== -1) memoryStore.doctors.splice(idx, 1);
      return res.status(200).json({
        success: true,
        message: "Successfully deleted",
      });
    }

    await Doctor.findByIdAndDelete(id);
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
    if (!isDbConnected()) {
      const doctor = memoryStore.doctors.find((d) => d._id === id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Failed to find Doctor",
        });
      }
      const doctorReviews = memoryStore.reviews.filter((r) => r.doctor === id);
      return res.status(200).json({
        success: true,
        message: "Doctor Found",
        data: { ...sanitizeDoc(doctor), reviews: doctorReviews },
      });
    }

    const doctor = await Doctor.findById(id)
      .populate("reviews")
      .select("-password");
    res.status(200).json({
      success: true,
      message: "Doctor Found",
      data: doctor,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Failed to find Doctor",
    });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const { query } = req.query;

    if (!isDbConnected()) {
      let doctors = memoryStore.doctors.filter(
        (d) => d.isApproved === "approved"
      );
      if (query) {
        const q = query.toLowerCase();
        doctors = doctors.filter(
          (d) =>
            (d.name && d.name.toLowerCase().includes(q)) ||
            (d.specialization && d.specialization.toLowerCase().includes(q))
        );
      }
      return res.status(200).json({
        success: true,
        message: "Doctors Found",
        data: doctors.map(sanitizeDoc),
      });
    }

    let doctors;
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

    res.status(200).json({
      success: true,
      message: "Doctors Found",
      data: doctors,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "No Doctors found",
    });
  }
};

export const getDoctorProfile = async (req, res) => {
  const doctorId = req.doctorId;

  try {
    if (!isDbConnected()) {
      const doctor = memoryStore.doctors.find((d) => d._id === doctorId);
      if (!doctor) {
        return res
          .status(404)
          .json({ success: false, message: "Doctor not found" });
      }
      const appointments = memoryStore.bookings.filter(
        (b) => b.doctor?._id === doctorId || b.doctor === doctorId
      );
      return res.status(200).json({
        success: true,
        message: "Profile info is getting",
        data: {
          ...sanitizeDoc(doctor),
          appointments:
            appointments.length > 0 ? appointments : doctor.appointments || [],
        },
      });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    const { password, ...rest } = doctor._doc;
    const appointments = await Booking.find({ doctor: doctorId });

    res.status(200).json({
      success: true,
      message: "Profile info is getting",
      data: { ...rest, appointments },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Someting went wrong, cannot get this",
      error: error.message,
    });
  }
};
