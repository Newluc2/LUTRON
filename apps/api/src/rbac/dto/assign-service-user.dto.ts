import { IsUUID } from 'class-validator';

export class AssignServiceUserDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  serviceId!: string;

  @IsUUID()
  roleId!: string;
}
