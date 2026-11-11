import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { BelegDto } from '../antraege/dto/antrag.dto';
import { Auth } from '../common/decorators/auth.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { Rolle } from '../generated/prisma/enums';
import {
  BelegeService,
  ERLAUBTE_MIME_TYPES,
  MAX_BELEG_BYTES,
  type HochgeladeneDatei,
} from './belege.service';

@ApiTags('belege')
@Controller()
export class BelegeController {
  constructor(private readonly belegeService: BelegeService) {}

  @Post('positionen/:positionId/beleg')
  @Auth(Rolle.MITARBEITENDE)
  @UseInterceptors(
    FileInterceptor('datei', { limits: { fileSize: MAX_BELEG_BYTES } }),
  )
  @ApiOperation({
    summary: 'Beleg (Handyfoto oder PDF) zu einer Position hochladen (MA-1)',
    description: `Multipart-Upload im Feld \`datei\`. Erlaubt: ${ERLAUBTE_MIME_TYPES.join(', ')}, max. 10 MB. Ein bestehender Beleg wird ersetzt.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['datei'],
      properties: { datei: { type: 'string', format: 'binary' } },
    },
  })
  @ApiParam({ name: 'positionId', example: 12 })
  @ApiCreatedResponse({ type: BelegDto })
  @ApiBadRequestResponse({
    description: 'Datei fehlt, falscher Typ oder zu gross',
  })
  @ApiNotFoundResponse({ description: 'Position nicht gefunden' })
  @ApiConflictResponse({ description: 'Antrag ist nicht mehr bearbeitbar' })
  hochladen(
    @CurrentUser() user: AuthUser,
    @Param('positionId', ParseIntPipe) positionId: number,
    @UploadedFile() datei?: HochgeladeneDatei,
  ): Promise<BelegDto> {
    return this.belegeService.hochladen(user.id, positionId, datei);
  }

  @Get('belege/:id')
  @Auth()
  @ApiOperation({
    summary: 'Belegdatei anzeigen (LB-2, VG-2)',
    description:
      'Liefert die Datei inline (Bild oder PDF). Zugriff haben die mitarbeitende Person selbst, ' +
      'ihre vorgesetzte Person und die Lohnbuchhaltung.',
  })
  @ApiParam({ name: 'id', example: 7 })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
  @ApiOkResponse({
    description: 'Die Belegdatei',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiNotFoundResponse({
    description: 'Beleg nicht gefunden oder kein Zugriff',
  })
  async herunterladen(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile> {
    const { stream, dateiname, mimeType } =
      await this.belegeService.herunterladen(user, id);
    return new StreamableFile(stream, {
      type: mimeType,
      disposition: `inline; filename="${encodeURIComponent(dateiname)}"`,
    });
  }

  @Delete('belege/:id')
  @Auth(Rolle.MITARBEITENDE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Beleg entfernen (nur solange der Antrag bearbeitbar ist)',
  })
  @ApiParam({ name: 'id', example: 7 })
  @ApiNoContentResponse()
  @ApiConflictResponse({ description: 'Antrag ist nicht mehr bearbeitbar' })
  loeschen(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.belegeService.loeschen(user.id, id);
  }
}
