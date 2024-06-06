import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Request_User_Key } from 'src/iam/iam.constants';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { Role } from 'src/users/enums/userRole.enum';
import { Roles_Key } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const contextRoles = this.reflector.getAllAndOverride<Role[]>(Roles_Key, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!contextRoles) {
      return true;
    }

    const user: ActiveUserData = context.switchToHttp().getRequest()[
      Request_User_Key
    ];
    return contextRoles.some((role) => user.role === role);
  }
}
