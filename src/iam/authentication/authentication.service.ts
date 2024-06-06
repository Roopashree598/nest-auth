import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  InvalidatedRefreshTokenError,
  RefreshTokenIdsStorage,
} from './refresh-token-ids.storage/refresh-token-ids.storage';
import { randomUUID } from 'crypto';
import { OtpAuthenticationService } from "./otp-authentication/otp-authentication.service";

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectModel(User.name) private readonly UserModel: Model<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    private readonly otpAuthService: OtpAuthenticationService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      const user = new this.UserModel(signUpDto);
      user.email = signUpDto.email;
      user.password = await this.hashingService.hash(signUpDto.password);

      return user.save();
    } catch (error) {
      const pgUniqueVoilationErrorCode = '23505';
      if (error.code === pgUniqueVoilationErrorCode) {
        throw new ConflictException();
      }
      throw error;
    }
  }

  async login(signInDto: SignInDto) {
    const user = await this.UserModel.findOne({
      email: signInDto.email,
    });
    if (!user) {
      throw new UnauthorizedException('User does not exists');
    }
    const isEqual = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );
    if (!isEqual) {
      throw new UnauthorizedException('Password does not match');
    }
    if (user.isTfaEnables) {
      const isValid = this.otpAuthService.verifyCode(
        signInDto.tfaCode,
        user.tfaSecret,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid 2fa')
      }
    }

    return await this.generateToken(user);
  }

  async generateToken(user: User) {
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        { email: user.email, role: user.role },
      ),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
        refreshTokenId,
      }),
    ]);

    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      //verify incoming refresh token
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & { refreshTokenId: string }
      >(refreshTokenDto.refreshToken, {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
      });

      const user = await this.UserModel.findOne({
        _id: sub,
      });

      const isValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      );

      if (isValid) {
        await this.refreshTokenIdsStorage.invalidateUser(user.id);
      } else {
        throw new Error('Invalid refresh token');
      }

      if (!user) {
        throw new UnauthorizedException('User does not exists');
      }

      return this.generateToken(user);
    } catch (err) {
      if (err instanceof InvalidatedRefreshTokenError) {
        throw new UnauthorizedException('Access Denied');
      }
      throw new UnauthorizedException();
    }
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessTokenTtl,
      },
    );
  }
}
