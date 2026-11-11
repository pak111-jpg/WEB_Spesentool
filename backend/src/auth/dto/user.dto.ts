import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Rolle } from '../../generated/prisma/enums';

export class UserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: 'P-1001',
    description: 'Personalnummer, erscheint im Lohn-Export',
  })
  personalnummer: string;

  @ApiProperty({ example: 'anna.meier@firma.ch' })
  email: string;

  @ApiProperty({ example: 'Anna Meier' })
  name: string;

  @ApiProperty({ enum: Rolle, enumName: 'Rolle', example: Rolle.MITARBEITENDE })
  rolle: Rolle;

  @ApiProperty({ example: 'KST-100', description: 'Kostenstelle der Person' })
  kostenstelle: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID der vorgesetzten Person (nur bei Mitarbeitenden)',
    nullable: true,
  })
  vorgesetzteId: number | null;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT für den Header `Authorization: Bearer <token>`',
  })
  accessToken: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}
