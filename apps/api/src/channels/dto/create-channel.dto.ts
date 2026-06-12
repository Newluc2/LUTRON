import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(['DISCORD', 'TELEGRAM'])
  type!: 'DISCORD' | 'TELEGRAM';

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsObject()
  config?: Record<string, string>;
}
