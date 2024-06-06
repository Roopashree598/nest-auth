import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request_User_Key } from '../iam.constants';
import { ActiveUserData } from '../interfaces/active-user-data.interface';

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: ActiveUserData | undefined = request[Request_User_Key];
    return field ? user?.[field] : user;
  },
);
