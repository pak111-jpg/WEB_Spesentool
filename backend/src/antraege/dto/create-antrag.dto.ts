import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

/** Datenobjekt der REST-API (Spesenanträge der Mitarbeitenden); Felder und Beispiele in Swagger. */
export class CreateAntragDto {
  @ApiProperty({ example: 2026, minimum: 2000, maximum: 2100 })
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
