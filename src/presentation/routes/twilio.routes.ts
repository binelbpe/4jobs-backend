import express from "express";
import { getTwilioToken } from "../controllers/TwilioController";

const router = express.Router();

router.get("/twilio-token", getTwilioToken);

export default router;
