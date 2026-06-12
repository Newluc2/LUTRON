import { IsEnum, IsNumber, IsObject, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LayoutDto {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsNumber()
  w!: number;

  @IsNumber()
  h!: number;
}

export class CreateWidgetDto {
  @IsEnum([
    'MONITORING_OVERVIEW',
    'AVAILABILITY_CHART',
    'CONFIG_BUTTON',
    'REMOTE_COMMAND',
    'LOCAL_COMMAND',
    'CONSOLE_OUTPUT',
    'LOG_STREAM',
    'CUSTOM_NOTE',
  ])
  type!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @ValidateNested()
  @Type(() => LayoutDto)
  layout?: LayoutDto;

  @IsOptional()
  @IsUUID()
  packId?: string;
}
