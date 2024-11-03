"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCall = void 0;
class VideoCall {
    constructor(id, callerId, recipientId, status, mediaStatus, createdAt, updatedAt, expiresAt) {
        this.id = id;
        this.callerId = callerId;
        this.recipientId = recipientId;
        this.status = status;
        this.mediaStatus = mediaStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.expiresAt = expiresAt;
    }
}
exports.VideoCall = VideoCall;
