import express from "express";
import { authenticate } from "./../auth/verifyToken.js";
import {
  getCheckoutSession,
  verifyRazorpayPayment,
} from "../Controllers/bookingController.js";

const router = express.Router();

router.post("/checkout-session/:doctorId", authenticate, getCheckoutSession);
router.post("/verify-payment", authenticate, verifyRazorpayPayment);

export default router;
