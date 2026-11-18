import Review from "../models/ReviewSchema.js";
import Doctor from "../models/DoctorSchema.js";
import { generateId, isDbConnected, memoryStore } from "../db/memoryStore.js";

export const getAllReviews = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const reviews = req.params.doctorId
        ? memoryStore.reviews.filter((r) => r.doctor === req.params.doctorId)
        : memoryStore.reviews;
      return res
        .status(200)
        .json({ success: true, message: "Successful", data: reviews });
    }

    const reviews = await Review.find({});

    res
      .status(200)
      .json({ success: true, message: "Successful", data: reviews });
  } catch (error) {
    res.status(200).json({ success: false, message: "Not Found" });
  }
};

export const createReview = async (req, res) => {
  if (!req.body.doctor) req.body.doctor = req.params.doctorId;
  if (!req.body.user) req.body.user = req.userId || req.params.userId;

  try {
    if (!isDbConnected()) {
      const userObj = memoryStore.users.find((u) => u._id === req.body.user);
      const savedReview = {
        _id: generateId(),
        doctor: req.body.doctor,
        user: {
          _id: req.body.user,
          name: userObj?.name || "Patient",
          photo: userObj?.photo || "/img/team-4.jpeg",
        },
        reviewText: req.body.reviewText,
        rating: Number(req.body.rating) || 5,
        createdAt: new Date().toISOString(),
      };
      memoryStore.reviews.push(savedReview);
      const doctor = memoryStore.doctors.find(
        (d) => d._id === req.body.doctor
      );
      if (doctor) {
        doctor.reviews.push(savedReview._id);
        const docReviews = memoryStore.reviews.filter(
          (r) => r.doctor === doctor._id
        );
        doctor.totalRating = docReviews.length;
        doctor.averageRating = Number(
          (
            docReviews.reduce((acc, item) => acc + item.rating, 0) /
            docReviews.length
          ).toFixed(1)
        );
      }
      return res.status(200).json({
        success: true,
        message: "Review Submitted",
        data: savedReview,
      });
    }

    const newReview = new Review(req.body);
    const savedReview = await newReview.save();
    await Doctor.findByIdAndUpdate(req.body.doctor, {
      $push: { reviews: savedReview._id },
    });

    res
      .status(200)
      .json({ success: true, message: "Review Submitted", data: savedReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
