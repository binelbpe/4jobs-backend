"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recruiterEventEmitter = exports.recruiterSocketManager = exports.recruiterIo = exports.userEventEmitter = exports.userSocketManager = exports.userIo = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const xss_1 = __importDefault(require("xss"));
const hpp_1 = __importDefault(require("hpp"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
require("reflect-metadata");
const container_1 = require("./infrastructure/container");
const userSocketServer_1 = require("./infrastructure/services/userSocketServer");
const recruiterUserSocketServer_1 = require("./infrastructure/services/recruiterUserSocketServer");
const authRoutes_1 = require("./presentation/routes/authRoutes");
const adminRoutes_1 = require("./presentation/routes/adminRoutes");
const RecruiterRoutes_1 = require("./presentation/routes/RecruiterRoutes");
const validateRequest_1 = require("./presentation/middlewares/validateRequest");
const errorHandler_1 = require("./presentation/middlewares/errorHandler");
// Load environment variables
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Setup Socket.io servers
const { io: userIo, userManager: userSocketManager, eventEmitter: userEventEmitter, } = (0, userSocketServer_1.setupUserSocketServer)(server, container_1.container);
exports.userIo = userIo;
exports.userSocketManager = userSocketManager;
exports.userEventEmitter = userEventEmitter;
const { io: recruiterIo, userManager: recruiterSocketManager, eventEmitter: recruiterEventEmitter, } = (0, recruiterUserSocketServer_1.setupSocketServer)(server, container_1.container);
exports.recruiterIo = recruiterIo;
exports.recruiterSocketManager = recruiterSocketManager;
exports.recruiterEventEmitter = recruiterEventEmitter;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", process.env.CLIENT_URL || ''],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, express_mongo_sanitize_1.default)());
const xssFilter = () => {
    return (req, res, next) => {
        if (req.body) {
            const sanitizedBody = JSON.parse(JSON.stringify(req.body), (key, value) => {
                if (typeof value === 'string') {
                    return (0, xss_1.default)(value, {
                        whiteList: {},
                        stripIgnoreTag: true,
                        stripIgnoreTagBody: ['script']
                    });
                }
                return value;
            });
            req.body = sanitizedBody;
        }
        next();
    };
};
app.use(xssFilter());
app.use((0, hpp_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["Content-Length", "Content-Type"],
}));
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
});
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.use("/", authRoutes_1.authRouter);
app.use("/admin", adminRoutes_1.adminRouter);
app.use("/recruiter", RecruiterRoutes_1.recruiterRouter);
app.use(validateRequest_1.validateRequest);
app.use(errorHandler_1.errorHandler);
app.use((req, res, next) => {
    req.container = container_1.container;
    next();
});
mongoose_1.default
    .connect(process.env.DATABASE_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
