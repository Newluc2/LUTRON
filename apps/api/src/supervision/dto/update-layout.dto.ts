import { IsArray, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LayoutPosDto {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsNumber()
  w!: number;

  @IsNumber()
  h!: number;
}

class LayoutItemDto {
  @IsUUID()
  id!: string;

  @ValidateNested()
  @Type(() => LayoutPosDto)
  layout!: LayoutPosDto;
}

export class UpdateLayoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutItemDto)
  layouts!: LayoutItemDto[];
}
