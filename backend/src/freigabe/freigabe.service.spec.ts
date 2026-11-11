import { arbeitstageZwischen } from './freigabe.service';

describe('arbeitstageZwischen', () => {
  it('zählt keine Tage am selben Tag', () => {
    expect(
      arbeitstageZwischen(
        new Date('2026-11-04T08:00Z'),
        new Date('2026-11-04T17:00Z'),
      ),
    ).toBe(0);
  });

  it('zählt Montag bis Mittwoch als zwei Arbeitstage', () => {
    // 2.11.2026 ist ein Montag
    expect(
      arbeitstageZwischen(
        new Date('2026-11-02T08:00Z'),
        new Date('2026-11-04T08:00Z'),
      ),
    ).toBe(2);
  });

  it('überspringt das Wochenende', () => {
    // Freitag 6.11. → Montag 9.11. = 1 Arbeitstag (Freitag)
    expect(
      arbeitstageZwischen(
        new Date('2026-11-06T08:00Z'),
        new Date('2026-11-09T08:00Z'),
      ),
    ).toBe(1);
  });

  it('Freitag eingereicht, Mittwoch geprüft → 3 Arbeitstage (überfällig)', () => {
    expect(
      arbeitstageZwischen(
        new Date('2026-11-06T08:00Z'),
        new Date('2026-11-11T08:00Z'),
      ),
    ).toBe(3);
  });
});
