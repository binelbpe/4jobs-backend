import { VideoCall } from '../../../entities/VideoCall';

export interface IUserVideoCallRepository {
  create(callerId: string, recipientId: string): Promise<VideoCall>;
  updateStatus(callId: string, status: 'accepted' | 'rejected' | 'ended'): Promise<VideoCall>;
  getActiveCall(userId: string): Promise<VideoCall | null>;
  findPendingCallForRecruiter(callerId: string): Promise<VideoCall | null>;
}
