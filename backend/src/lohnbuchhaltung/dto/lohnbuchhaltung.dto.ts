import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AntragStatus } from '../../generated/prisma/enums';

export class MonatQueryDto {
  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  jahr: number;

  @ApiProperty({ example: 11, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  monat: number;
}

export class AbrechnungenQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsInt()
  jahr?: number;

  @ApiPropertyOptional({ example: 11, minimum: 1, maximum: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  monat?: number;

  @ApiPropertyOptional({
    enum: AntragStatus,
    enumName: 'AntragStatus',
    description: 'Standard: GENEHMIGT (also noch nicht ausbezahlt)',
  })
  @IsOptional()
  @IsEnum(AntragStatus)
  status?: AntragStatus;
}

export class AusbezahltErgebnisDto {
  @ApiProperty({
    example: 4,
    description: 'Anzahl Abrechnungen, die auf AUSBEZAHLT gesetzt wurden',
  })
  anzahl: number;

  @ApiProperty({ example: [3, 5, 8, 9], type: [Number] })
  antragIds: number[];
}

export class KostenstellenAuswertungDto {
  @ApiProperty({ example: 'KST-100' })
  kostenstelle: string;

  @ApiProperty({
    example: 3,
    description: 'Anzahl genehmigter/ausbezahlter Abrechnungen',
  })
  anzahlAbrechnungen: number;

  @ApiProperty({ example: 11, description: 'Anzahl Positionen' })
  anzahlPositionen: number;

  @ApiProperty({ example: 1234.5, description: 'Summe in CHF' })
  total: number;
}
