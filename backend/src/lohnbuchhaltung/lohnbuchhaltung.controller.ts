import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AntragDetailDto, AntragDto } from '../antraege/dto/antrag.dto';
import { Auth } from '../common/decorators/auth.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { Rolle } from '../generated/prisma/enums';
import {
  AbrechnungenQueryDto,
  AusbezahltErgebnisDto,
  KostenstellenAuswertungDto,
  MonatQueryDto,
} from './dto/lohnbuchhaltung.dto';
import { LohnbuchhaltungService } from './lohnbuchhaltung.service';

@ApiTags('lohnbuchhaltung')
@Auth(Rolle.LOHNBUCHHALTUNG)
@Controller('lohnbuchhaltung')
export class LohnbuchhaltungController {
  constructor(private readonly service: LohnbuchhaltungService) {}

  @Get('abrechnungen')
  @ApiOperation({
    summary:
      'Abrechnungen auflisten (Standard: genehmigt und noch nicht ausbezahlt)',
    description:
      'Filter nach Jahr, Monat und Status. Ausbezahlte Abrechnungen sind klar am Status AUSBEZAHLT erkennbar.',
  })
  @ApiOkResponse({ type: [AntragDto] })
  abrechnungen(@Query() query: AbrechnungenQueryDto): Promise<AntragDto[]> {
    return this.service.abrechnungen(query);
  }

  @Get('abrechnungen/:id')
  @ApiOperation({
    summary: 'Abrechnung mit Positionen und Belegnachweis einsehen (LB-2)',
  })
  @ApiParam({ name: 'id', example: 3 })
  @ApiOkResponse({ type: AntragDetailDto })
  @ApiNotFoundResponse()
  eine(@Param('id', ParseIntPipe) id: number): Promise<AntragDetailDto> {
    return this.service.eine(id);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({
    summary: 'Genehmigte Abrechnungen eines Monats als CSV exportieren (LB-1)',
    description:
      'Enthält nur Abrechnungen mit Status GENEHMIGT. Spalten: AntragId; Personalnummer; Name; Monat; Kostenstelle; ' +
      'AnzahlPositionen; TotalCHF. Bereits ausbezahlte Abrechnungen erscheinen nicht erneut.',
  })
  @ApiProduces('text/csv')
  @ApiOkResponse({
    description: 'CSV-Datei (Download)',
    schema: { type: 'string' },
  })
  async exportieren(
    @Query() query: MonatQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.service.exportCsv(query.jahr, query.monat);
    const dateiname = `spesen-${query.jahr}-${String(query.monat).padStart(2, '0')}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${dateiname}"`);
    // BOM, damit Excel UTF-8 (Umlaute) korrekt erkennt
    res.send(String.fromCharCode(0xfeff) + csv);
  }

  @Post('abrechnungen/:id/ausbezahlt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Abrechnung als ausbezahlt markieren (LB-3)',
    description:
      'GENEHMIGT → AUSBEZAHLT (Endzustand). Eine bereits ausbezahlte Abrechnung kann nicht erneut markiert werden.',
  })
  @ApiParam({ name: 'id', example: 3 })
  @ApiOkResponse({ type: AntragDetailDto })
  @ApiConflictResponse({
    description: 'Abrechnung ist nicht genehmigt oder bereits ausbezahlt',
  })
  ausbezahlt(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AntragDetailDto> {
    return this.service.alsAusbezahltMarkieren(user.id, id);
  }

  @Post('monat/ausbezahlt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Alle genehmigten Abrechnungen eines Monats als ausbezahlt markieren (Monatsende)',
  })
  @ApiOkResponse({ type: AusbezahltErgebnisDto })
  monatAusbezahlt(
    @CurrentUser() user: AuthUser,
    @Body() dto: MonatQueryDto,
  ): Promise<AusbezahltErgebnisDto> {
    return this.service.monatAusbezahlen(user.id, dto.jahr, dto.monat);
  }

  @Get('auswertung')
  @ApiOperation({ summary: 'Spesen pro Kostenstelle auswerten (LB-4)' })
  @ApiOkResponse({ type: [KostenstellenAuswertungDto] })
  auswertung(
    @Query() query: MonatQueryDto,
  ): Promise<KostenstellenAuswertungDto[]> {
    return this.service.auswertungKostenstellen(query.jahr, query.monat);
  }
}
