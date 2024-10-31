"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endRoom = exports.getTwilioToken = void 0;
const twilio_1 = __importDefault(require("twilio"));
const uuid_1 = require("uuid");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
const client = (0, twilio_1.default)(apiKeySid, apiKeySecret, { accountSid });
const getTwilioToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!accountSid || !apiKeySid || !apiKeySecret) {
            console.error("Missing Twilio credentials");
            return res.status(500).json({ error: "Twilio configuration error" });
        }
        // Get Network Traversal Service token first
        const ntsToken = yield client.tokens.create();
        // Create a unique room name
        const roomName = `room-${(0, uuid_1.v4)()}`;
        // Create a Video room
        const room = yield client.video.v1.rooms.create({
            uniqueName: roomName,
            type: "peer-to-peer",
            maxParticipants: 2,
        });
        // Create an Access Token
        const AccessToken = twilio_1.default.jwt.AccessToken;
        const VideoGrant = AccessToken.VideoGrant;
        // Create Video grant
        const videoGrant = new VideoGrant({
            room: roomName,
        });
        // Create access token
        const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
            identity: req.query.identity || "user",
        });
        // Add video grant to token
        token.addGrant(videoGrant);
        // Generate the token
        const accessToken = token.toJwt();
        const response = {
            token: accessToken,
            roomName: roomName,
            roomSid: room.sid,
            expires: Date.now() + 3600 * 1000,
            // Include ICE servers from Network Traversal Service
            iceServers: (_a = ntsToken.iceServers) === null || _a === void 0 ? void 0 : _a.map(server => ({
                urls: server.url || server.urls,
                username: server.username || '',
                credential: server.credential || ''
            }))
        };
        console.log('Sending Twilio config with ICE servers:', ((_b = response.iceServers) === null || _b === void 0 ? void 0 : _b.length) || 0, 'servers');
        res.json(response);
    }
    catch (error) {
        console.error("Error generating Twilio token:", error);
        res.status(500).json({ error: "Failed to generate token" });
    }
});
exports.getTwilioToken = getTwilioToken;
// Add endpoint to end room
const endRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomSid } = req.params;
        yield client.video.v1.rooms(roomSid).update({ status: "completed" });
        res.json({ message: "Room ended successfully" });
    }
    catch (error) {
        console.error("Error ending room:", error);
        res.status(500).json({ error: "Failed to end room" });
    }
});
exports.endRoom = endRoom;
