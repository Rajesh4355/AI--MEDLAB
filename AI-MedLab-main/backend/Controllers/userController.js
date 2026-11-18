import User from "../models/UserSchema.js";
import Booking from "../models/BookingSchema.js";
import Doctor from "../models/DoctorSchema.js";
import { isDbConnected, memoryStore, sanitizeDoc } from "../db/memoryStore.js";

export const updateUser = async (req, res) => {
  const id = req.params.id;
  try {
    if (!isDbConnected()) {
      const idx = memoryStore.users.findIndex((u) => u._id === id);
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      memoryStore.users[idx] = { ...memoryStore.users[idx], ...req.body };
      return res.status(200).json({
        success: true,
        message: "Successfully updated",
        data: sanitizeDoc(memoryStore.users[idx]),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
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
    if (!isDbConnected()) {
      const idx = memoryStore.users.findIndex((u) => u._id === id);
      if (idx !== -1) memoryStore.users.splice(idx, 1);
      return res.status(200).json({
        success: true,
        message: "Successfully deleted",
      });
    }

    await User.findByIdAndDelete(id);
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
    if (!isDbConnected()) {
      const user = memoryStore.users.find((u) => u._id === id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Failed to find user",
        });
      }
      return res.status(200).json({
        success: true,
        message: "User Found",
        data: sanitizeDoc(user),
      });
    }

    const user = await User.findById(id).select("-password");
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
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "No users found",
    });
  }
};

export const getUserProfile = async (req, res) => {
  const userId = req.userId;

  try {
    if (!isDbConnected()) {
      const user = memoryStore.users.find((u) => u._id === userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      return res.status(200).json({
        success: true,
        message: "Profile info is getting",
        data: sanitizeDoc(user),
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { password, ...rest } = user._doc;

    res.status(200).json({
      success: true,
      message: "Profile info is getting",
      data: { ...rest },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Someting went wrong, cannot get this",
    });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const bookings = memoryStore.bookings.filter(
        (b) => b.user?._id === req.userId || b.user === req.userId
      );
      const doctorIds = bookings.map((el) => el.doctor?._id || el.doctor);
      const doctors = memoryStore.doctors
        .filter((d) => doctorIds.includes(d._id))
        .map(sanitizeDoc);
      return res.status(200).json({
        success: true,
        message: "Appointments are getting",
        data: doctors,
      });
    }

    const bookings = await Booking.find({ user: req.userId });
    const doctorIds = bookings.map((el) => el.doctor.id);
    const doctors = await Doctor.find({ _id: { $in: doctorIds } }).select(
      "-password"
    );
    res.status(200).json({
      success: true,
      message: "Appointments are getting",
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Someting went wrong, cannot get this",
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

    if (!isDbConnected()) {
      const doctor = memoryStore.doctors.find((d) => d._id === doctorId);
      if (!doctor) {
        return res.status(400).json({
          success: false,
          message: "This Doctor is not available now",
        });
      }
      const appointment = {
        patientName: appointmentData.patientName,
        patientGender: appointmentData.patientGender,
        payment: appointmentData.payment,
        price: appointmentData.price,
        bookedOn: appointmentData.bookedOn,
        testName: appointmentData.testName,
        testResult: appointmentData.testResult,
      };
      doctor.appointments.push(appointment);
      return res.status(200).json({
        success: true,
        data: sanitizeDoc(doctor),
        message: "Appoint booking done",
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: "This Doctor is not available now",
      });
    }
    const appointment = {
      patientName: appointmentData.patientName,
      patientGender: appointmentData.patientGender,
      payment: appointmentData.payment,
      price: appointmentData.price,
      bookedOn: appointmentData.bookedOn,
      testName: appointmentData.testName,
      testResult: appointmentData.testResult,
    };
    doctor.appointments.push(appointment);

    await doctor.save();
    return res.status(200).json({
      success: true,
      data: doctor,
      message: "Appoint booking done",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
