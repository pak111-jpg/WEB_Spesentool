import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AntragStatus, Kategorie } from '../../generated/prisma/enums';

export class BelegDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 12 })
  positionId: number;

  @ApiProperty({ example: 'quittung-sbb.jpg' })
  dateiname: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ example: 184233, description: 'Dateigrösse in Bytes' })
  groesse: number;

  @ApiProperty({
    example: '/belege/7',
    description: 'Pfad, unter dem die Datei abgerufen werden kann',
  })
  url: string;

  @ApiProperty({ example: '2026-11-03T14:12:00.000Z' })
  hochgeladenAm: Date;
}

export class PositionDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 3 })
  antragId: number;

  @ApiProperty({
    example: '2026-11-03',
    description: 'Datum der Auslage (YYYY-MM-DD)',
  })
  datum: string;

  @ApiProperty({
    enum: Kategorie,
    enumName: 'Kategorie',
    example: Kategorie.FAHRT,
  })
  kategorie: Kategorie;

  @ApiProperty({ example: 'Kundenbesuch Zürich' })
  zweck: string;

  @ApiPropertyOptional({
    example: 42.5,
    nullable: true,
    description: 'Nur bei Kategorie FAHRT',
  })
  kilometer: number | null;

  @ApiProperty({
    example: 29.75,
    description: 'Betrag in CHF (bei FAHRT automatisch berechnet)',
  })
  betrag: number;

  @ApiPropertyOptional({ type: BelegDto, nullable: true })
  beleg: BelegDto | null;
}

export class PersonKurzDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'P-1001' })
  personalnummer: string;

  @ApiProperty({ example: 'Anna Meier' })
  name: string;

  @ApiProperty({ example: 'KST-100' })
  kostenstelle: string;
}

export class AntragDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 2026 })
  jahr: number;

  @ApiProperty({ example: 11, minimum: 1, maximum: 12 })
  monat: number;

  @ApiProperty({
    enum: AntragStatus,
    enumName: 'AntragStatus',
    example: AntragStatus.ERFASST,
  })
  status: AntragStatus;

  @ApiProperty({ type: PersonKurzDto })
  mitarbeitende: PersonKurzDto;

  @ApiProperty({ example: 2, description: 'Anzahl Positionen' })
  anzahlPositionen: number;

  @ApiProperty({
    example: 129.75,
    description: 'Summe aller Positionen in CHF (vom System berechnet)',
  })
  total: number;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Beleg zu Position 2 ist unleserlich',
    description:
      'Begründung der vorgesetzten Person bei ZURUECKGEWIESEN oder ABGELEHNT',
  })
  begruendung: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-11-30T09:00:00.000Z' })
  eingereichtAm: Date | null;

  @ApiPropertyOptional({ type: PersonKurzDto, nullable: true })
  entschiedenVon: PersonKurzDto | null;

  @ApiPropertyOptional({ nullable: true })
  entschiedenAm: Date | null;

  @ApiPropertyOptional({ nullable: true })
  ausbezahltAm: Date | null;

  @ApiProperty()
  erstelltAm: Date;

  @ApiProperty()
  geaendertAm: Date;
}

export class AntragDetailDto extends AntragDto {
  @ApiProperty({ type: [PositionDto] })
  positionen: PositionDto[];
}
