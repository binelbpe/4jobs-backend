import { VideoCall } from '../../../entities/VideoCall';

export interface IVideoCallRepository {
  create(callerId: string, recipientId: string): Promise<VideoCall>;
  updateStatus(callId: string, status: 'pending' | 'active' | 'accepted' | 'rejected' | 'ended'): Promise<VideoCall>;
  getActiveCall(userId: string): Promise<VideoCall | null>;
  findActiveCallForRecruiter(recruiterId: string): Promise<VideoCall | null>;
  findPendingCallForRecruiter(recruiterId: string): Promise<VideoCall | null>;
}
