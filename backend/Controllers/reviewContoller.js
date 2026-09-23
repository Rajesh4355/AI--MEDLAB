import Review from "../models/ReviewSchema.js";
import Doctor from "../models/DoctorSchema.js";
import mongoose from "mongoose";
import { mockStore } from "../mockStore.js";

// get all reviews
export const getAllReviews = async (req, res) => {
  try {
    let reviews = [];
    if (mongoose.connection.readyState === 1) {
      try {
        reviews = await Review.find({});
      } catch (dbErr) {
        console.warn("Review find failed:", dbErr.message);
      }
    }

    if (!reviews || reviews.length === 0) {
      reviews = mockStore.getAllReviews();
    }

    res
      .status(200)
      .json({ success: true, message: "Successful", data: reviews });
  } catch (error) {
    res.status(200).json({ success: true, message: "Successful", data: mockStore.getAllReviews() });
  }
};

// create review
export const createReview = async (req, res) => {
  const doctorId = req.body.doctor || req.params.doctorId;
  const userId = req.body.user || req.params.userId || req.userId;

  try {
    let savedReview = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const newReview = new Review({ ...req.body, doctor: doctorId, user: userId });
        savedReview = await newReview.save();
        await Doctor.findByIdAndUpdate(doctorId, {
          $push: { reviews: savedReview._id },
        });
      } catch (dbErr) {
        console.warn("DB save review failed:", dbErr.message);
      }
    }

    if (!savedReview) {
      savedReview = mockStore.createReview({
        doctor: doctorId,
        user: userId,
        reviewText: req.body.reviewText,
        rating: req.body.rating || 5,
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Review Submitted", data: savedReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
