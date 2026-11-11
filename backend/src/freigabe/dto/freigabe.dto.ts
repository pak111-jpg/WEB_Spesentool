import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AntragDto } from '../../antraege/dto/antrag.dto';
import { AntragStatus } from '../../generated/prisma/enums';

export class BegruendungDto {
  @ApiProperty({
    example: 'Beleg zu Position 2 ist unleserlich, bitte neu fotografieren.',
    description:
      'Pflichtfeld – die mitarbeitende Person sieht diesen Text (VG-3)',
    minLength: 5,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  begruendung: string;
}

export class OffeneAntraegeQueryDto {
  @ApiPropertyOptional({
    description:
      'Nur Anträge, die länger als zwei Arbeitstage offen sind (VG-4)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  nurUeberfaellig?: boolean;
}

export class TeamAntraegeQueryDto {
  @ApiPropertyOptional({ enum: AntragStatus, enumName: 'AntragStatus' })
  @IsOptional()
  @IsEnum(AntragStatus)
  status?: AntragStatus;
}

export class OffenerAntragDto extends AntragDto {
  @ApiProperty({
    example: 3,
    description: 'Arbeitstage (Mo–Fr) seit dem Einreichen',
  })
  offenSeitArbeitstagen: number;

  @ApiProperty({
    example: true,
    description:
      'true, wenn die Frist von zwei Arbeitstagen überschritten ist (VG-4)',
  })
  ueberfaellig: boolean;
}
