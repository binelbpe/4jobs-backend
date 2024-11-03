import { inject, injectable } from 'inversify';
import TYPES from '../../../types';
import { IVideoCallRepository } from '../../../domain/interfaces/repositories/recruiter/IVideoCallRepository';
import { VideoCall } from '../../../domain/entities/VideoCall';

@injectable()
export class InitiateVideoCallUseCase {
  constructor(
    @inject(TYPES.IVideoCallRepository) private videoCallRepository: IVideoCallRepository
  ) {}

  async execute(recruiterId: string, userId: string): Promise<VideoCall> {
    const existingCall = await this.videoCallRepository.findActiveCallForRecruiter(recruiterId);
    if (existingCall) {
      await this.videoCallRepository.updateStatus(existingCall.id, 'ended');
    }

    return this.videoCallRepository.create(recruiterId, userId);
  }
}
