import { ApiProperty } from '@nestjs/swagger';

export class PositionFehlerDto {
  @ApiProperty({
    example: 12,
    nullable: true,
    description: 'Betroffene Position; null bei Fehlern am ganzen Antrag',
  })
  positionId: number | null;

  @ApiProperty({ example: ['Beleg fehlt'], type: [String] })
  fehler: string[];
}

/** Antwort mit Status 400, wenn ein Antrag nicht eingereicht werden kann. */
export class EinreichenFehlerDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    example: 'Antrag ist unvollständig und wurde nicht eingereicht',
  })
  message: string;

  @ApiProperty({ type: [PositionFehlerDto] })
  probleme: PositionFehlerDto[];
}
