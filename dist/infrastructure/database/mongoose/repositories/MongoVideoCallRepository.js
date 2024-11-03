"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoVideoCallRepository = void 0;
const inversify_1 = require("inversify");
const VideoCall_1 = require("../../../../domain/entities/VideoCall");
const VideoCallModel_1 = require("../models/VideoCallModel");
let MongoVideoCallRepository = class MongoVideoCallRepository {
    create(callerId, recipientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const videoCall = new VideoCallModel_1.VideoCallModel({
                callerId,
                recipientId,
                status: 'pending',
                mediaStatus: { audio: true, video: true },
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + 30000) // 30 seconds expiry
            });
            yield videoCall.save();
            return this.mapToEntity(videoCall);
        });
    }
    updateStatus(callId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const videoCall = yield VideoCallModel_1.VideoCallModel.findByIdAndUpdate(callId, Object.assign({ status, updatedAt: new Date() }, (status === 'accepted' && { expiresAt: new Date(Date.now() + 3600000) })), { new: true });
            if (!videoCall) {
                throw new Error('Video call not found');
            }
            return this.mapToEntity(videoCall);
        });
    }
    getActiveCall(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const call = yield VideoCallModel_1.VideoCallModel.findOne({
                $or: [{ callerId: userId }, { recipientId: userId }],
                status: { $in: ['pending', 'active', 'accepted'] }
            });
            return call ? this.mapToEntity(call) : null;
        });
    }
    findActiveCallForRecruiter(recruiterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const call = yield VideoCallModel_1.VideoCallModel.findOne({
                callerId: recruiterId,
                status: { $in: ['pending', 'active', 'accepted'] }
            });
            return call ? this.mapToEntity(call) : null;
        });
    }
    findPendingCallForRecruiter(recruiterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const call = yield VideoCallModel_1.VideoCallModel.findOne({
                callerId: recruiterId,
                status: 'pending'
            });
            return call ? this.mapToEntity(call) : null;
        });
    }
    mapToEntity(document) {
        return new VideoCall_1.VideoCall(document._id.toString(), document.callerId, document.recipientId, document.status, document.mediaStatus, document.createdAt, document.updatedAt, document.expiresAt);
    }
};
exports.MongoVideoCallRepository = MongoVideoCallRepository;
exports.MongoVideoCallRepository = MongoVideoCallRepository = __decorate([
    (0, inversify_1.injectable)()
], MongoVideoCallRepository);
