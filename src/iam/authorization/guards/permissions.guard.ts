import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Request_User_Key } from 'src/iam/iam.constants';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { Permission_Key } from '../decorators/permissions.decorator';
import { PermissionType } from '../permission.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const contextRoles = this.reflector.getAllAndOverride<PermissionType[]>(
      Permission_Key,
      [context.getHandler(), context.getClass()],
    );
    if (!contextRoles) {
      return true;
    }

    const user: ActiveUserData = context.switchToHttp().getRequest()[
      Request_User_Key
    ];
    return contextRoles.every((permission) =>
      user.permissioms?.includes(permission),
    );
  }
}
