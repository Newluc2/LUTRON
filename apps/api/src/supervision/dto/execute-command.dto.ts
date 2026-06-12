import { IsObject, IsOptional, IsString } from 'class-validator';

export class ExecuteCommandDto {
  @IsOptional()
  @IsString()
  command?: string;

  @IsOptional()
  @IsString()
  overrideCommand?: string;

  @IsOptional()
  @IsString()
  cwd?: string;

  @IsOptional()
  @IsString()
  mode?: 'local' | 'remote';

  @IsOptional()
  @IsObject()
  remoteConfig?: Record<string, string>;
}
