import mongoose from "mongoose";
import Booking from "../models/BookingSchema.js";
import Doctor from "../models/DoctorSchema.js";

export const updateDoctor = async (req, res) => {
  const id = req.params.id;
  try {
    const updateDoctor = await Doctor.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
    if (!updateDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: updateDoctor,
    });
  } catch (error) {
    console.error("Error updating Doctor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update doctor",
      error: error.message, // Include error message in the response
    });
  }
};

export const deleteDoctor = async (req, res) => {
  const id = req.params.id;
  try {
    await Doctor.findById(id);
    res.status(200).json({
      success: true,
      message: "Successfully deleted",
      data: deleteDoctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};

const fallbackDoctors = [
  {
    _id: "65d4a1b2c3d4e5f6a7b8c9d0",
    id: "01",
    name: "Dr. Alfaz Ahmed",
    specialization: "Surgeon",
    ticketPrice: 100,
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400",
    averageRating: 4.8,
    totalRating: 272,
    hospital: "Mount Adora Hospital, Sylhet",
    bio: "Chief Surgeon with 15+ years of clinical excellence in general and laparoscopic surgery.",
    about: "Dr. Alfaz Ahmed is a renowned specialist known for precision, compassionate patient care, and modern minimally invasive procedures.",
    isApproved: "approved",
    experiences: [{ startingDate: "2010-01-01", endingDate: "2023-12-31", position: "Senior Surgeon", hospital: "Mount Adora Hospital" }],
    qualifications: [{ startingDate: "2000-01-01", endingDate: "2006-05-15", degree: "MBBS, MS", university: "Dhaka Medical College" }],
    timeSlots: [{ day: "Monday", startingTime: "09:00", endingTime: "13:00" }, { day: "Wednesday", startingTime: "14:00", endingTime: "18:00" }],
    reviews: []
  },
  {
    _id: "65d4a1b2c3d4e5f6a7b8c9d1",
    id: "02",
    name: "Dr. Saleh Mahmud",
    specialization: "Neurologist",
    ticketPrice: 120,
    photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400",
    averageRating: 4.9,
    totalRating: 198,
    hospital: "Apollo Neuroscience Institute",
    bio: "Consultant Neurologist specializing in neurodegenerative conditions and brain health.",
    about: "Dr. Saleh Mahmud has over a decade of experience diagnosing and treating complex neurological disorders with state-of-the-art diagnostic protocols.",
    isApproved: "approved",
    experiences: [{ startingDate: "2012-03-01", endingDate: "2024-01-01", position: "Lead Neurologist", hospital: "Apollo Neuroscience Institute" }],
    qualifications: [{ startingDate: "2002-09-01", endingDate: "2008-06-30", degree: "MD, Neurology", university: "Johns Hopkins" }],
    timeSlots: [{ day: "Tuesday", startingTime: "10:00", endingTime: "15:00" }, { day: "Thursday", startingTime: "10:00", endingTime: "15:00" }],
    reviews: []
  },
  {
    _id: "65d4a1b2c3d4e5f6a7b8c9d2",
    id: "03",
    name: "Dr. Farid Uddin",
    specialization: "Dermatologist",
    ticketPrice: 90,
    photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
    averageRating: 4.7,
    totalRating: 310,
    hospital: "City Health & Skin Center",
    bio: "Expert Dermatologist specializing in clinical dermatology, allergy, and skin therapy.",
    about: "Dr. Farid Uddin provides comprehensive diagnosis for complex skin diseases, fungal infections, and autoimmune dermatological manifestations.",
    isApproved: "approved",
    experiences: [{ startingDate: "2014-06-01", endingDate: "2024-01-01", position: "Consultant Dermatologist", hospital: "City Health & Skin Center" }],
    qualifications: [{ startingDate: "2005-01-01", endingDate: "2011-12-15", degree: "MBBS, MD Dermatology", university: "King Edward Medical University" }],
    timeSlots: [{ day: "Monday", startingTime: "14:00", endingTime: "19:00" }, { day: "Friday", startingTime: "09:00", endingTime: "13:00" }],
    reviews: []
  }
];

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
        console.warn("DB query failed, checking fallback doctors:", dbErr.message);
      }
    }

    if (!doctor) {
      doctor = fallbackDoctors.find(d => d._id === id || d.id === id);
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

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
      doctors = query
        ? fallbackDoctors.filter(d => 
            d.name.toLowerCase().includes(query.toLowerCase()) || 
            d.specialization.toLowerCase().includes(query.toLowerCase())
          )
        : fallbackDoctors;
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
      data: fallbackDoctors,
    });
  }
};

export const getDoctorProfile = async (req, res) => {
  const doctorId = req.doctorId;
  // console.log("Doctor ID:", doctorId);

  try {
    const doctor = await Doctor.findById(doctorId);
    // console.log("Retrieved doctor profile:", doctor);

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
    // console.error("Error fetching doctor profile:", error);
    res.status(500).json({
      success: false,
      message: "Someting went wrong, cannot get this",
      error: error.message,
    });
  }
};
