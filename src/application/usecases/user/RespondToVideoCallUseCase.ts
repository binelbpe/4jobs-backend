import { inject, injectable } from "inversify";
import TYPES from "../../../types";
import { IUserVideoCallRepository } from "../../../domain/interfaces/repositories/user/IUserVideoCallRepository";
import { VideoCall } from "../../../domain/entities/VideoCall";

@injectable()
export class RespondToVideoCallUseCase {
  constructor(
    @inject(TYPES.IUserVideoCallRepository) private videoCallRepository: IUserVideoCallRepository
  ) {}

  async execute(callerId: string, accept: boolean): Promise<VideoCall> {
    const videoCall = await this.videoCallRepository.findPendingCallForRecruiter(callerId);
    if (!videoCall) {
      throw new Error('No pending call found');
    }

    const newStatus = accept ? 'accepted' as const : 'rejected' as const;
    return this.videoCallRepository.updateStatus(videoCall.id, newStatus);
  }
}
