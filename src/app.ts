import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import "reflect-metadata";

import { container } from "./infrastructure/container";
import TYPES from "./types";
import { setupUserSocketServer } from "./infrastructure/services/userSocketServer";
import { setupSocketServer } from "./infrastructure/services/recruiterUserSocketServer";

import { authRouter } from "./presentation/routes/authRoutes";
import { adminRouter } from "./presentation/routes/adminRoutes";
import { recruiterRouter } from "./presentation/routes/RecruiterRoutes";

import { validateRequest } from "./presentation/middlewares/validateRequest";
import { errorHandler } from "./presentation/middlewares/errorHandler";

// Load environment variables


const app = express();
const server = http.createServer(app);

// Setup Socket.io servers
const {
  io: userIo,
  userManager: userSocketManager,
  eventEmitter: userEventEmitter,
} = setupUserSocketServer(server, container);

const {
  io: recruiterIo,
  userManager: recruiterSocketManager,
  eventEmitter: recruiterEventEmitter,
} = setupSocketServer(server, container);


app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", process.env.CLIENT_URL || ''],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(mongoSanitize());


const xssFilter = () => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.body) {
      const sanitizedBody = JSON.parse(JSON.stringify(req.body), (key, value) => {
        if (typeof value === 'string') {
          return xss(value, {
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

app.use(hpp());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["Content-Length", "Content-Type"],
  })
);


app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});


app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use("/", authRouter);
app.use("/admin", adminRouter);
app.use("/recruiter", recruiterRouter);


app.use(validateRequest);
app.use(errorHandler);

app.use((req: any, res, next) => {
  req.container = container;
  next();
});


mongoose
  .connect(process.env.DATABASE_URL!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export {
  userIo,
  userSocketManager,
  userEventEmitter,
  recruiterIo,
  recruiterSocketManager,
  recruiterEventEmitter,
};