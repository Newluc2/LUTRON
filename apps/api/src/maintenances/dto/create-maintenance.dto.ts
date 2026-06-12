import { IsDateString, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMaintenanceDto {
  @IsUUID()
  serviceId!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
