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
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = (0, twilio_1.default)(accountSid, authToken);
const getTwilioToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        if (!accountSid || !authToken) {
            console.error('Missing Twilio credentials');
            return res.status(500).json({ error: 'Twilio configuration error' });
        }
        console.log('Initializing Twilio token generation with:', {
            accountSid: `${accountSid.slice(0, 5)}...`,
            hasAuthToken: !!authToken,
            identity: req.query.identity
        });
        // Create a unique room name
        const roomName = `room-${(0, uuid_1.v4)()}`;
        console.log('Created Twilio room:', roomName);
        // Create an Access Token
        const AccessToken = twilio_1.default.jwt.AccessToken;
        const VideoGrant = AccessToken.VideoGrant;
        // Create Video grant
        const videoGrant = new VideoGrant({
            room: roomName
        });
        console.log('Created Twilio video grant for room:', roomName);
        // Create access token with identity
        const token = new AccessToken(accountSid, process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, { identity: req.query.identity || 'user' });
        console.log('Created Twilio access token for identity:', req.query.identity);
        // Add video grant to token
        token.addGrant(videoGrant);
        // Get Network Traversal Service token
        const ntsToken = yield client.tokens.create({
            ttl: 86400 // 24 hours
        });
        console.log('Received Twilio NTS token with:', {
            hasIceServers: ((_a = ntsToken.iceServers) === null || _a === void 0 ? void 0 : _a.length) || 0,
            ttl: ntsToken.ttl,
            username: ntsToken.username ? 'present' : 'missing'
        });
        // Format response
        const response = {
            username: ntsToken.username,
            ice_servers: (_b = ntsToken.iceServers) === null || _b === void 0 ? void 0 : _b.map(server => ({
                urls: server.url || server.urls,
                username: server.username,
                credential: server.credential
            })),
            date_updated: ntsToken.dateUpdated,
            account_sid: ntsToken.accountSid,
            ttl: ntsToken.ttl.toString(),
            date_created: ntsToken.dateCreated,
            password: ntsToken.password,
            token: token.toJwt(),
            roomName: roomName
        };
        console.log('Sending Twilio configuration:', {
            iceServers: ((_c = response.ice_servers) === null || _c === void 0 ? void 0 : _c.length) || 0,
            hasToken: !!response.token,
            roomName: response.roomName,
            ttl: response.ttl
        });
        res.json(response);
    }
    catch (error) {
        console.error('Error generating Twilio token:', error);
        res.status(500).json({
            error: 'Failed to generate token',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
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
