import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../enums/userRole.enum';

@Schema()
export class User extends Document {
  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop({ enum: Role, default: Role.User })
  role: Role;

  @Prop({ default: false })
  isTfaEnables: boolean;

  @Prop({ nullable: true })
  tfaSecret: string; // secret of 2 factor auth
}

export const UsersSchema = SchemaFactory.createForClass(User);
