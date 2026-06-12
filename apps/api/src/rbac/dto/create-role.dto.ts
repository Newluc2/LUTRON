import { IsArray, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateRoleDto {
  @IsUUID()
  serviceId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}
