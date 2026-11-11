import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AntragDetailDto, AntragDto } from '../antraege/dto/antrag.dto';
import { Auth } from '../common/decorators/auth.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { Rolle } from '../generated/prisma/enums';
import {
  BegruendungDto,
  OffeneAntraegeQueryDto,
  OffenerAntragDto,
  TeamAntraegeQueryDto,
} from './dto/freigabe.dto';
import { FreigabeService } from './freigabe.service';

@ApiTags('freigabe')
@Auth(Rolle.VORGESETZTE)
@Controller('freigabe')
export class FreigabeController {
  constructor(private readonly freigabeService: FreigabeService) {}

  @Get('offen')
  @ApiOperation({
    summary: 'Offene (eingereichte) Anträge des eigenen Teams (VG-1, VG-4)',
    description:
      'Älteste zuerst. Jeder Eintrag trägt `offenSeitArbeitstagen` und `ueberfaellig` (> 2 Arbeitstage).',
  })
  @ApiOkResponse({ type: [OffenerAntragDto] })
  offene(
    @CurrentUser() user: AuthUser,
    @Query() query: OffeneAntraegeQueryDto,
  ): Promise<OffenerAntragDto[]> {
    return this.freigabeService.offene(user.id, query.nurUeberfaellig ?? false);
  }

  @Get('antraege')
  @ApiOperation({
    summary:
      'Alle Anträge des Teams, optional nach Status gefiltert (Historie)',
  })
  @ApiOkResponse({ type: [AntragDto] })
  team(
    @CurrentUser() user: AuthUser,
    @Query() query: TeamAntraegeQueryDto,
  ): Promise<AntragDto[]> {
    return this.freigabeService.team(user.id, query.status);
  }

  @Get('antraege/:id')
  @ApiOperation({ summary: 'Antrag mit Positionen und Belegen prüfen (VG-2)' })
  @ApiParam({ name: 'id', example: 3 })
  @ApiOkResponse({ type: AntragDetailDto })
  @ApiNotFoundResponse({
    description: 'Antrag nicht gefunden oder nicht aus dem eigenen Team',
  })
  einer(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AntragDetailDto> {
    return this.freigabeService.einer(user.id, id);
  }

  @Post('antraege/:id/genehmigen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Antrag genehmigen (VG-2)',
    description:
      'EINGEREICHT → GENEHMIGT. Der Antrag verschwindet aus der Liste der offenen Anträge und ist gesperrt.',
  })
  @ApiParam({ name: 'id', example: 3 })
  @ApiOkResponse({ type: AntragDetailDto })
  @ApiConflictResponse({
    description: 'Antrag ist nicht im Status EINGEREICHT',
  })
  genehmigen(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AntragDetailDto> {
    return this.freigabeService.genehmigen(user.id, id);
  }

  @Post('antraege/:id/zurueckweisen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Antrag mit Begründung zurückweisen (VG-3)',
    description:
      'EINGEREICHT → ZURUECKGEWIESEN. Die mitarbeitende Person sieht die Begründung, kann die Positionen korrigieren ' +
      'und denselben Antrag erneut einreichen.',
  })
  @ApiParam({ name: 'id', example: 3 })
  @ApiOkResponse({ type: AntragDetailDto })
  @ApiConflictResponse({
    description: 'Antrag ist nicht im Status EINGEREICHT',
  })
  zurueckweisen(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BegruendungDto,
  ): Promise<AntragDetailDto> {
    return this.freigabeService.zurueckweisen(user.id, id, dto.begruendung);
  }

  @Post('antraege/:id/ablehnen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Antrag endgültig ablehnen',
    description:
      'EINGEREICHT → ABGELEHNT (Endzustand, keine Korrektur mehr möglich).',
  })
  @ApiParam({ name: 'id', example: 3 })
  @ApiOkResponse({ type: AntragDetailDto })
  @ApiConflictResponse({
    description: 'Antrag ist nicht im Status EINGEREICHT',
  })
  ablehnen(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BegruendungDto,
  ): Promise<AntragDetailDto> {
    return this.freigabeService.ablehnen(user.id, id, dto.begruendung);
  }
}
