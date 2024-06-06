import { SetMetadata } from '@nestjs/common';
import { CoffeesPermission } from 'src/coffees/coffees.permission';

export const Permission_Key = 'roles';
export const Roles = (...permissions: CoffeesPermission[]) =>
  SetMetadata(Permission_Key, permissions);
