import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterModuleDto {
  @IsString()
  @MinLength(2)
  id!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  version!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
