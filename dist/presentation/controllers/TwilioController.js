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
exports.getTwilioToken = void 0;
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const client = (0, twilio_1.default)(accountSid, authToken);
const getTwilioToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!accountSid || !authToken || !apiKey || !apiSecret) {
            console.error('Missing Twilio credentials');
            return res.status(500).json({ error: 'Twilio configuration error' });
        }
        // Create token with Network Traversal Service
        const token = yield client.tokens.create({
            ttl: 3600
        });
        // Log token creation but not sensitive data
        console.log('Twilio token created:', {
            timestamp: new Date().toISOString(),
            iceServers: ((_a = token.iceServers) === null || _a === void 0 ? void 0 : _a.length) || 0
        });
        // Format and sanitize the response
        const response = {
            iceServers: ((_b = token.iceServers) === null || _b === void 0 ? void 0 : _b.map(server => ({
                urls: server.url || server.urls,
                username: server.username,
                credential: server.credential
            }))) || [],
            ttl: token.ttl || 3600,
            date_created: token.dateCreated || new Date()
        };
        // Cache control headers
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.json(response);
    }
    catch (error) {
        console.error('Error generating Twilio token:', error);
        // Don't expose internal error details to client
        res.status(500).json({
            error: 'Failed to generate token',
            code: 'TWILIO_TOKEN_ERROR'
        });
    }
});
exports.getTwilioToken = getTwilioToken;
