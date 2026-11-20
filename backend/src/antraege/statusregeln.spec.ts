import { AntragStatus, Rolle } from '../generated/prisma/enums';
import {
  darfRolleUebergang,
  istBearbeitbar,
  istEndzustand,
  istUebergangErlaubt,
  pruefeVollstaendigkeit,
  PruefPosition,
} from './statusregeln';

const {
  ERFASST,
  EINGEREICHT,
  ZURUECKGEWIESEN,
  GENEHMIGT,
  AUSBEZAHLT,
  ABGELEHNT,
} = AntragStatus;

describe('istUebergangErlaubt (Zustandsdiagramm)', () => {
  it.each([
    [ERFASST, EINGEREICHT],
    [EINGEREICHT, GENEHMIGT],
    [EINGEREICHT, ZURUECKGEWIESEN],
    [EINGEREICHT, ABGELEHNT],
    [ZURUECKGEWIESEN, EINGEREICHT],
    [GENEHMIGT, AUSBEZAHLT],
  ])('erlaubt %s → %s', (von, nach) => {
    expect(istUebergangErlaubt(von, nach)).toBe(true);
  });

  it.each([
    [ERFASST, GENEHMIGT],
    [ERFASST, AUSBEZAHLT],
    [GENEHMIGT, ZURUECKGEWIESEN],
    [GENEHMIGT, EINGEREICHT],
    [ABGELEHNT, EINGEREICHT],
    [ABGELEHNT, GENEHMIGT],
    [AUSBEZAHLT, AUSBEZAHLT],
    [AUSBEZAHLT, GENEHMIGT],
    [ZURUECKGEWIESEN, GENEHMIGT],
  ])('verbietet %s → %s', (von, nach) => {
    expect(istUebergangErlaubt(von, nach)).toBe(false);
  });
});

describe('darfRolleUebergang', () => {
  it('nur Vorgesetzte entscheiden', () => {
    expect(darfRolleUebergang(Rolle.VORGESETZTE, GENEHMIGT)).toBe(true);
    expect(darfRolleUebergang(Rolle.MITARBEITENDE, GENEHMIGT)).toBe(false);
    expect(darfRolleUebergang(Rolle.LOHNBUCHHALTUNG, ABGELEHNT)).toBe(false);
  });

  it('nur die Lohnbuchhaltung zahlt aus', () => {
    expect(darfRolleUebergang(Rolle.LOHNBUCHHALTUNG, AUSBEZAHLT)).toBe(true);
    expect(darfRolleUebergang(Rolle.VORGESETZTE, AUSBEZAHLT)).toBe(false);
  });

  it('nur Mitarbeitende reichen ein', () => {
    expect(darfRolleUebergang(Rolle.MITARBEITENDE, EINGEREICHT)).toBe(true);
    expect(darfRolleUebergang(Rolle.VORGESETZTE, EINGEREICHT)).toBe(false);
  });
});

describe('istBearbeitbar und istEndzustand', () => {
  it('bearbeitbar nur in ERFASST und ZURUECKGEWIESEN', () => {
    expect(istBearbeitbar(ERFASST)).toBe(true);
    expect(istBearbeitbar(ZURUECKGEWIESEN)).toBe(true);
    expect(istBearbeitbar(EINGEREICHT)).toBe(false);
    expect(istBearbeitbar(GENEHMIGT)).toBe(false);
  });

  it('AUSBEZAHLT und ABGELEHNT sind Endzustände', () => {
    expect(istEndzustand(AUSBEZAHLT)).toBe(true);
    expect(istEndzustand(ABGELEHNT)).toBe(true);
    expect(istEndzustand(GENEHMIGT)).toBe(false);
  });
});

describe('pruefeVollstaendigkeit (MA-3)', () => {
  const vollstaendig: PruefPosition = {
    id: 1,
    datum: new Date('2026-11-03'),
    betrag: 24.9,
    zweck: 'Mittagessen Kundenbesuch',
    hatBeleg: true,
  };

  it('ein Antrag ohne Positionen ist unvollständig', () => {
    expect(pruefeVollstaendigkeit([])).toEqual([
      { positionId: null, fehler: ['Der Antrag enthält keine Positionen'] },
    ]);
  });

  it('vollständige Positionen ergeben keine Probleme', () => {
    expect(pruefeVollstaendigkeit([vollstaendig])).toEqual([]);
  });

  it('meldet fehlenden Beleg und leeren Zweck pro Position', () => {
    const probleme = pruefeVollstaendigkeit([
      vollstaendig,
      { ...vollstaendig, id: 2, hatBeleg: false, zweck: '  ' },
    ]);
    expect(probleme).toEqual([
      { positionId: 2, fehler: ['Zweck fehlt', 'Beleg fehlt'] },
    ]);
  });

  it('meldet Betrag 0', () => {
    const probleme = pruefeVollstaendigkeit([{ ...vollstaendig, betrag: 0 }]);
    expect(probleme[0].fehler).toContain('Betrag fehlt oder ist 0');
  });
});
