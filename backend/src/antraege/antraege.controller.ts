import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { Rolle } from '../generated/prisma/enums';
import { AntraegeService } from './antraege.service';
import { AntragDetailDto, AntragDto } from './dto/antrag.dto';
import { CreateAntragDto } from './dto/create-antrag.dto';
import { EinreichenFehlerDto } from './dto/einreichen-fehler.dto';

@ApiTags('antraege')
@Auth(Rolle.MITARBEITENDE)
@Controller('antraege')
export class AntraegeController {
  constructor(private readonly antraegeService: AntraegeService) {}

  @Post()
  @ApiOperation({
    summary: 'Neuen Spesenantrag (Monatsabrechnung) anlegen',
    description:
      'Pro Person und Monat gibt es genau einen Antrag. Der neue Antrag hat den Status ERFASST.',
  })
  @ApiCreatedResponse({ type: AntragDetailDto })
  @ApiConflictResponse({
    description: 'Für diesen Monat existiert bereits ein Antrag',
  })
  erstellen(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAntragDto,
  ): Promise<AntragDetailDto> {
    return this.antraegeService.erstellen(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Eigene Anträge mit Status auflisten (MA-4)' })
  @ApiOkResponse({ type: [AntragDto] })
  meine(@CurrentUser() user: AuthUser): Promise<AntragDto[]> {
    return this.antraegeService.meine(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Eigenen Antrag mit allen Positionen und Belegen laden',
  })
  @ApiParam({ name: 'id', example: 3 })
  @ApiOkResponse({ type: AntragDetailDto })
  @ApiNotFoundResponse({
    description:
      'Antrag nicht gefunden oder gehört nicht der angemeldeten Person',
  })
  einer(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AntragDetailDto> {
    return this.antraegeService.einer(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eigenen Antrag löschen (nur im Status ERFASST)' })
  @ApiParam({ name: 'id', example: 3 })
  @ApiNoContentResponse()
  @ApiConflictResponse({
    description: 'Antrag ist nicht mehr im Status ERFASST',
  })
  loeschen(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.antraegeService.loeschen(user.id, id);
  }

  @Post(':id/einreichen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Monatsabrechnung einreichen (MA-3)',
    description:
      'Prüft, ob jede Position Datum, Betrag, Zweck und Beleg hat. Fehlt etwas, kommt 400 mit der Liste der ' +
      'betroffenen Positionen und der Antrag bleibt im bisherigen Status. Sonst wechselt er auf EINGEREICHT und ist ' +
      'für die mitarbeitende Person gesperrt. Ein zurückgewiesener Antrag kann nach der Korrektur erneut eingereicht werden.',
  })
  @ApiParam({ name: 'id', example: 3 })
  @ApiOkResponse({ type: AntragDetailDto })
  @ApiBadRequestResponse({
    type: EinreichenFehlerDto,
    description: 'Antrag unvollständig',
  })
  @ApiConflictResponse({
    description: 'Antrag ist nicht im Status ERFASST oder ZURUECKGEWIESEN',
  })
  einreichen(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AntragDetailDto> {
    return this.antraegeService.einreichen(user.id, id);
  }
}
