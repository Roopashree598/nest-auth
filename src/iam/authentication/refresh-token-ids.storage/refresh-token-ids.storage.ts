import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UserRefreshToken } from 'src/users/entities/user-refresh-token.entity';

export class InvalidatedRefreshTokenError extends Error {}

@Injectable()
export class RefreshTokenIdsStorage
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    @InjectModel(UserRefreshToken.name)
    private readonly UserRefreshTokenModel: Model<UserRefreshToken>,
  ) {}

  private connection: Connection;

  onApplicationBootstrap() {
    MongooseModule.forRoot(
      'mongodb+srv://roopa:trimax123@cluster0.wfrz9lo.mongodb.net/test',
    );
  }

  onApplicationShutdown(signal?: string) {
    return this.connection.close();
  }

  async insert(userId: string, tokenId: string): Promise<void> {
    const UserRefreshToken = new this.UserRefreshTokenModel({
      userId: userId,
      tokenId: tokenId,
    });
    UserRefreshToken.save();
  }

  async validate(userId: string, tokenId: string): Promise<boolean> {
    const result = await this.UserRefreshTokenModel.findOne({
      userId: userId,
      tokenId: tokenId,
    });
    if (result.tokenId !== tokenId) {
      throw new InvalidatedRefreshTokenError();
    }
    return result.tokenId === tokenId;
  }

  async invalidateUser(userId: number): Promise<void> {
    await this.UserRefreshTokenModel.deleteOne({ userId: userId }).exec();
  }

  // private getKey(userId: number): string {
  //   return `user-${userId}`;
  // }
}
