import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { User, UsersSchema } from 'src/users/entities/user.entity';
import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypt.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './authentication/guards/access-token/access-token.guard';
import { AuthenticationGuard } from './authentication/guards/authentication/authentication.guard';
import { RefreshTokenIdsStorage } from './authentication/refresh-token-ids.storage/refresh-token-ids.storage';
import {
  UserRefreshToken,
  UserRefreshTokenSchema,
} from 'src/users/entities/user-refresh-token.entity';
import { RolesGuard } from './authorization/guards/roles.guard';
import { PermissionsGuard } from './authorization/guards/permissions.guard';
import { OtpAuthenticationService } from "./authentication/otp-authentication/otp-authentication.service";


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UsersSchema },
      { name: UserRefreshToken.name, schema: UserRefreshTokenSchema },
    ]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    //we can protect respective route by using useGuards instead of applying globally
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // PermissionsGuard,
    },
    AccessTokenGuard,
    RefreshTokenIdsStorage,
    AuthenticationService,
    OtpAuthenticationService,
  ],
  controllers: [AuthenticationController],
})
export class IamModule {}
