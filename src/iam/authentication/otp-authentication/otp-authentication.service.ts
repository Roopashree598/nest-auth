import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { authenticator } from 'otplib';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class OtpAuthenticationService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly UserModel: Model<User>,
  ) {}

  //create qr code using otplib
  async generateSecret(email: string) {
    const secret = authenticator.generateSecret();
    const appName = this.configService.getOrThrow('tfa_app_name');
    const uri = authenticator.keyuri(email, appName, secret);
    return {
      uri,
      secret,
    };
  }

  verifyCode(code: string, secret: string) {
    return authenticator.verify({
      token: code,
      secret,
    });
  }

  async enableTfaForUser(email: string, secret: string) {
    const user = await this.UserModel.findOne({ email: email })
      .select('_id')
      .exec();
    await this.UserModel.updateOne(
      { _id: user._id },
      { $set: { tfaSecret: secret, isTfaEnables: true } },
    ).exec();
  }
}
