import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Kategorie } from '../../generated/prisma/enums';

export class CreatePositionDto {
  @ApiProperty({
    example: '2026-11-03',
    description:
      'Datum der Auslage (YYYY-MM-DD), muss im Monat des Antrags liegen',
  })
  @IsDateString()
  datum: string;

  @ApiProperty({
    enum: Kategorie,
    enumName: 'Kategorie',
    example: Kategorie.VERPFLEGUNG,
  })
  @IsEnum(Kategorie)
  kategorie: Kategorie;

  @ApiProperty({ example: 'Mittagessen Kundenbesuch Zürich', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  zweck: string;

  @ApiPropertyOptional({
    example: 42.5,
    description:
      'Gefahrene Kilometer – Pflicht bei Kategorie FAHRT, der Betrag wird daraus berechnet (MA-2)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1)
  kilometer?: number;

  @ApiPropertyOptional({
    example: 24.9,
    description:
      'Betrag in CHF – Pflicht bei allen Kategorien ausser FAHRT (dort wird er ignoriert)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  betrag?: number;
}

export class UpdatePositionDto extends PartialType(CreatePositionDto) {}
