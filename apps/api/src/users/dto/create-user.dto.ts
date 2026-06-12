import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(4)
  password!: string;

  @IsOptional()
  @IsEnum(['OWNER', 'USER'])
  role?: 'OWNER' | 'USER';
}
