import express from "express";
import { getTwilioToken } from "../controllers/TwilioController";
import { twilioRateLimit } from "../middleware/rateLimit";
import { errorHandler } from "../middleware/errorHandler";

const router = express.Router();

router.get("/twilio-token", twilioRateLimit, getTwilioToken);
router.use(errorHandler);

export default router;
