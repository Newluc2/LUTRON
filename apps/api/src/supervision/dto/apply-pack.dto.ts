import { IsUUID } from 'class-validator';

export class ApplyPackDto {
  @IsUUID()
  packId!: string;
}
