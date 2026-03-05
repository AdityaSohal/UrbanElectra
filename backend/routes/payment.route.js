import express from "express";
import {protectRoute } from "../middleware/auth.middleware.js";
import {checkOutSuccess,createCheckOutSession} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session",protectRoute,createCheckOutSession);
router.post("/checkout-success",protectRoute,checkOutSuccess);

export default router;