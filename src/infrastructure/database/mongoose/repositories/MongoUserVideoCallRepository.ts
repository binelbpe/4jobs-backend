import { injectable } from 'inversify';
import { IUserVideoCallRepository } from '../../../../domain/interfaces/repositories/user/IUserVideoCallRepository';
import { VideoCall } from '../../../../domain/entities/VideoCall';
import { UserVideoCallModel } from '../models/UserVideoCallModel';

@injectable()
export class MongoUserVideoCallRepository implements IUserVideoCallRepository {
  async create(callerId: string, recipientId: string): Promise<VideoCall> {
    const videoCall = new UserVideoCallModel({
      callerId,
      recipientId,
      status: 'pending',
      mediaStatus: { audio: true, video: true },
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30000)
    });

    await videoCall.save();
    return this.mapToEntity(videoCall);
  }

  async updateStatus(
    callId: string,
    status: 'accepted' | 'rejected' | 'ended'
  ): Promise<VideoCall> {
    const videoCall = await UserVideoCallModel.findByIdAndUpdate(
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
    const call = await UserVideoCallModel.findOne({
      $or: [{ callerId: userId }, { recipientId: userId }],
      status: { $in: ['pending', 'accepted'] }
    });

    return call ? this.mapToEntity(call) : null;
  }

  async findPendingCallForRecruiter(callerId: string): Promise<VideoCall | null> {
    const call = await UserVideoCallModel.findOne({
      callerId,
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


