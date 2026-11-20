import { Prisma } from '../generated/prisma/client';
import {
  AntragDetailDto,
  AntragDto,
  BelegDto,
  PersonKurzDto,
  PositionDto,
  StatusAenderungDto,
} from './dto/antrag.dto';

/** Prisma-Include, das für die Antrags-DTOs benötigt wird. */
export const antragInclude = {
  mitarbeitende: true,
  entschiedenVon: true,
  positionen: { include: { beleg: true }, orderBy: { datum: 'asc' } },
  verlauf: {
    include: { user: true },
    orderBy: [{ zeitpunkt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.SpesenantragInclude;

/** Antrag mit Person, Positionen, Belegen und Verlauf. */
export type AntragMitPositionen = Prisma.SpesenantragGetPayload<{
  include: typeof antragInclude;
}>;
/** Position inklusive Beleg, so wie sie über `antragInclude` geladen wird. */
export type PositionMitBeleg = AntragMitPositionen['positionen'][number];
type VerlaufMitUser = AntragMitPositionen['verlauf'][number];

const dec = (value: Prisma.Decimal | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);

/** Person auf die Felder kürzen, die andere Rollen sehen dürfen (ohne E-Mail, Passwort). */
export function toPersonKurzDto(user: {
  id: number;
  personalnummer: string;
  name: string;
  kostenstelle: string;
}): PersonKurzDto {
  return {
    id: user.id,
    personalnummer: user.personalnummer,
    name: user.name,
    kostenstelle: user.kostenstelle,
  };
}

/** Beleg-Datensatz → DTO mit Abruf-URL. */
export function toBelegDto(
  beleg: NonNullable<PositionMitBeleg['beleg']>,
): BelegDto {
  return {
    id: beleg.id,
    positionId: beleg.positionId,
    dateiname: beleg.dateiname,
    mimeType: beleg.mimeType,
    groesse: beleg.groesse,
    url: `/belege/${beleg.id}`,
    hochgeladenAm: beleg.hochgeladenAm,
  };
}

/** Position → DTO (Decimal → number, Datum als YYYY-MM-DD). */
export function toPositionDto(position: PositionMitBeleg): PositionDto {
  return {
    id: position.id,
    antragId: position.antragId,
    datum: position.datum.toISOString().slice(0, 10),
    kategorie: position.kategorie,
    zweck: position.zweck,
    kilometer: dec(position.kilometer),
    betrag: dec(position.betrag) ?? 0,
    beleg: position.beleg ? toBelegDto(position.beleg) : null,
  };
}

/** MA-2: Total eines Antrags in CHF, auf Rappen gerundet. */
export function berechneTotal(
  positionen: { betrag: Prisma.Decimal }[],
): number {
  const total = positionen.reduce((summe, p) => summe + Number(p.betrag), 0);
  return Math.round(total * 100) / 100;
}

/** Antrag → DTO für Listen (ohne Positionen, mit berechnetem Total). */
export function toAntragDto(antrag: AntragMitPositionen): AntragDto {
  return {
    id: antrag.id,
    jahr: antrag.jahr,
    monat: antrag.monat,
    status: antrag.status,
    mitarbeitende: toPersonKurzDto(antrag.mitarbeitende),
    anzahlPositionen: antrag.positionen.length,
    total: berechneTotal(antrag.positionen),
    begruendung: antrag.begruendung,
    eingereichtAm: antrag.eingereichtAm,
    entschiedenVon: antrag.entschiedenVon
      ? toPersonKurzDto(antrag.entschiedenVon)
      : null,
    entschiedenAm: antrag.entschiedenAm,
    ausbezahltAm: antrag.ausbezahltAm,
    erstelltAm: antrag.erstelltAm,
    geaendertAm: antrag.geaendertAm,
  };
}

/** Antrag → DTO für die Detailansicht (mit Positionen und Verlauf). */
export function toAntragDetailDto(
  antrag: AntragMitPositionen,
): AntragDetailDto {
  return {
    ...toAntragDto(antrag),
    positionen: antrag.positionen.map(toPositionDto),
    verlauf: antrag.verlauf.map(toStatusAenderungDto),
  };
}

/** Eintrag im Verlauf → DTO (U2.4: Zeitpunkt, Person, Rolle, von → nach). */
export function toStatusAenderungDto(
  eintrag: VerlaufMitUser,
): StatusAenderungDto {
  return {
    id: eintrag.id,
    vonStatus: eintrag.vonStatus,
    nachStatus: eintrag.nachStatus,
    zeitpunkt: eintrag.zeitpunkt,
    person: toPersonKurzDto(eintrag.user),
    rolle: eintrag.rolle,
    begruendung: eintrag.begruendung,
  };
}
