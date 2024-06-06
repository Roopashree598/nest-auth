import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class UserRefreshToken extends Document {
  @Prop()
  userId: string;

  @Prop()
  tokenId: string;
}

export const UserRefreshTokenSchema =
  SchemaFactory.createForClass(UserRefreshToken);
