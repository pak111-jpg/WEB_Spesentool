import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { PositionDto } from '../antraege/dto/antrag.dto';
import { Auth } from '../common/decorators/auth.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { Rolle } from '../generated/prisma/enums';
import { CreatePositionDto, UpdatePositionDto } from './dto/position-input.dto';
import { PositionenService } from './positionen.service';

class KilometerpauschaleDto {
  @ApiProperty({
    example: 0.7,
    description: 'Entschädigung pro Kilometer in CHF',
  })
  chfProKilometer: number;
}

@ApiTags('positionen')
@Auth(Rolle.MITARBEITENDE)
@Controller()
export class PositionenController {
  constructor(private readonly positionenService: PositionenService) {}

  @Get('positionen/kilometerpauschale')
  @ApiOperation({
    summary: 'Aktuelle Kilometerpauschale (zur Anzeige im Frontend)',
  })
  @ApiOkResponse({ type: KilometerpauschaleDto })
  kilometerpauschale(): KilometerpauschaleDto {
    return { chfProKilometer: this.positionenService.getKilometerpauschale() };
  }

  @Post('antraege/:antragId/positionen')
  @ApiOperation({
    summary: 'Spesenposition zu einem Antrag erfassen (MA-1, MA-2)',
    description:
      'Nur möglich, solange der Antrag im Status ERFASST oder ZURUECKGEWIESEN ist. ' +
      'Bei Kategorie FAHRT wird der Betrag aus Kilometer × Pauschale berechnet.',
  })
  @ApiParam({ name: 'antragId', example: 3 })
  @ApiCreatedResponse({ type: PositionDto })
  @ApiBadRequestResponse({
    description:
      'Ungültige Eingaben (z. B. Datum ausserhalb des Monats, Kilometer fehlen)',
  })
  @ApiNotFoundResponse({ description: 'Antrag nicht gefunden' })
  @ApiConflictResponse({ description: 'Antrag ist nicht mehr bearbeitbar' })
  erstellen(
    @CurrentUser() user: AuthUser,
    @Param('antragId', ParseIntPipe) antragId: number,
    @Body() dto: CreatePositionDto,
  ): Promise<PositionDto> {
    return this.positionenService.erstellen(user.id, antragId, dto);
  }

  @Patch('positionen/:id')
  @ApiOperation({
    summary: 'Spesenposition korrigieren (MA-5)',
    description:
      'Teil-Update. Bei einer Rückweisung kann so nur die betroffene Position angepasst werden.',
  })
  @ApiParam({ name: 'id', example: 12 })
  @ApiOkResponse({ type: PositionDto })
  @ApiNotFoundResponse({ description: 'Position nicht gefunden' })
  @ApiConflictResponse({ description: 'Antrag ist nicht mehr bearbeitbar' })
  aktualisieren(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePositionDto,
  ): Promise<PositionDto> {
    return this.positionenService.aktualisieren(user.id, id, dto);
  }

  @Delete('positionen/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Spesenposition inkl. Beleg löschen' })
  @ApiParam({ name: 'id', example: 12 })
  @ApiNoContentResponse()
  @ApiConflictResponse({ description: 'Antrag ist nicht mehr bearbeitbar' })
  loeschen(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.positionenService.loeschen(user.id, id);
  }
}
