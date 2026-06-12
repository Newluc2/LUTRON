import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @IsUUID()
  serviceId!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(1)
  content!: string;
}
