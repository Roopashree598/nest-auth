import { Injectable } from '@nestjs/common';

@Injectable()
//creatting an interface
export abstract class HashingService {
  //created to store the hash value
  abstract hash(data: string | Buffer): Promise<string>;
  //created to compare the hash value against encrypted data
  abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>;
}
