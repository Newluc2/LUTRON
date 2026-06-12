import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(['OWNER', 'USER'])
  role?: 'OWNER' | 'USER';

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}
