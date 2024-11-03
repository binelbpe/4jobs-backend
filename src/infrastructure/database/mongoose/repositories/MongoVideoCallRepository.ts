import { injectable } from "inversify";
import { IVideoCallRepository } from "../../../../domain/interfaces/repositories/recruiter/IVideoCallRepository";
import { VideoCall } from "../../../../domain/entities/VideoCall";
import { VideoCallModel } from "../models/VideoCallModel";

@injectable()
export class MongoVideoCallRepository implements IVideoCallRepository {
  async create(callerId: string, recipientId: string): Promise<VideoCall> {
    const videoCall = new VideoCallModel({
      callerId,
      recipientId,
      status: 'pending',
      mediaStatus: { audio: true, video: true },
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30000) // 30 seconds expiry
    });

    await videoCall.save();
    return this.mapToEntity(videoCall);
  }

  async updateStatus(
    callId: string,
    status: 'pending' | 'active' | 'accepted' | 'rejected' | 'ended'
  ): Promise<VideoCall> {
    const videoCall = await VideoCallModel.findByIdAndUpdate(
      callId,
      { 
        status,
        updatedAt: new Date(),
        ...(status === 'accepted' && { expiresAt: new Date(Date.now() + 3600000) })
      },
      { new: true }
    );

    if (!videoCall) {
      throw new Error('Video call not found');
    }

    return this.mapToEntity(videoCall);
  }

  async getActiveCall(userId: string): Promise<VideoCall | null> {
    const call = await VideoCallModel.findOne({
      $or: [{ callerId: userId }, { recipientId: userId }],
      status: { $in: ['pending', 'active', 'accepted'] }
    });

    return call ? this.mapToEntity(call) : null;
  }

  async findActiveCallForRecruiter(recruiterId: string): Promise<VideoCall | null> {
    const call = await VideoCallModel.findOne({
      callerId: recruiterId,
      status: { $in: ['pending', 'active', 'accepted'] }
    });

    return call ? this.mapToEntity(call) : null;
  }

  async findPendingCallForRecruiter(recruiterId: string): Promise<VideoCall | null> {
    const call = await VideoCallModel.findOne({
      callerId: recruiterId,
      status: 'pending'
    });

    return call ? this.mapToEntity(call) : null;
  }

  private mapToEntity(document: any): VideoCall {
    return new VideoCall(
      document._id.toString(),
      document.callerId,
      document.recipientId,
      document.status,
      document.mediaStatus,
      document.createdAt,
      document.updatedAt,
      document.expiresAt
    );
  }
}
