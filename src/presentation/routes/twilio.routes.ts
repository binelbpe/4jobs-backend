import express from "express";
import { getTwilioToken, endRoom } from "../controllers/TwilioController";
import { twilioRateLimit } from "../middleware/rateLimit";
import { errorHandler } from "../middleware/errorHandler";

const router = express.Router();

router.get("/twilio-token", twilioRateLimit, getTwilioToken);
router.post("/rooms/:roomSid/end", twilioRateLimit, endRoom);
router.use(errorHandler);

export default router;
