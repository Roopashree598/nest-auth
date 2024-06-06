import { Role } from 'src/users/enums/userRole.enum';
import { PermissionType } from '../authorization/permission.type';

export interface ActiveUserData {
  // userId that granted token
  sub: number;
  //extra prop we added to payload
  email: string;
  role: Role;
  permissioms: PermissionType[];
}
