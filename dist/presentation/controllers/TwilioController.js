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
const client = (0, twilio_1.default)(accountSid, authToken);
const getTwilioToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!accountSid || !authToken) {
            console.error('Missing Twilio credentials');
            return res.status(500).json({ error: 'Twilio credentials not configured' });
        }
        // Create token with default options
        const token = yield client.tokens.create();
        console.log('Twilio token created:', {
            iceServers: (_a = token.iceServers) === null || _a === void 0 ? void 0 : _a.length,
            ttl: token.ttl
        });
        // Format the response
        const response = {
            iceServers: ((_b = token.iceServers) === null || _b === void 0 ? void 0 : _b.map(server => ({
                urls: server.url || server.urls,
                username: server.username,
                credential: server.credential
            }))) || [],
            ttl: 3600, // 1 hour
            date_created: new Date()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error generating Twilio token:', error);
        res.status(500).json({
            error: 'Failed to generate Twilio token',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.getTwilioToken = getTwilioToken;
