import { inject, injectable } from "inversify";
import { IPostRepository } from "../../../../domain/interfaces/repositories/user/IPostRepository";
import { IPost } from "../../../../domain/entities/Post";
import TYPES from "../../../../types";

@injectable()
export class CommentOnPostUseCase {
  constructor(
    @inject(TYPES.PostRepository) private postRepository: IPostRepository
  ) {}

  async execute(
    postId: string,
    userId: string,
    content: string
  ): Promise<IPost | null> {
    return this.postRepository.addComment(postId, { userId, content });
  }

  async deleteComment(postId: string, commentId: string): Promise<IPost | null> {
    return this.postRepository.deleteComment(postId, commentId);
  }
}
