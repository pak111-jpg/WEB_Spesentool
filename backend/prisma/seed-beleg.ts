/**
 * Erzeugt einfache, lesbare Musterbelege als PDF für die Demo-Daten.
 * Ein PDF ist eine Textdatei mit nummerierten Objekten und einem Inhaltsverzeichnis (xref).
 * So braucht der Seed kein zusätzliches Paket. Alle Firmen und Nummern sind erfunden.
 */

/** Schützt Klammern und Backslash, die im PDF-Text eine Bedeutung haben. */
function pdfText(text: string): string {
  return text.replace(/[\\()]/g, (zeichen) => `\\${zeichen}`);
}

/** Inhalt der Seite: erste Zeile gross, danach normale Zeilen untereinander. */
function seiteninhalt(zeilen: string[]): string {
  return zeilen
    .map((zeile, i) => {
      const groesse = i === 0 ? 14 : 10;
      const y = 380 - i * 18;
      return `BT /F1 ${groesse} Tf 24 ${y} Td (${pdfText(zeile)}) Tj ET`;
    })
    .join('\n');
}

/** Baut ein einseitiges PDF (Format A6) mit den übergebenen Textzeilen. */
export function belegPdf(zeilen: string[]): Buffer {
  const inhalt = seiteninhalt(zeilen);
  const objekte = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 298 420] ' +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(inhalt, 'latin1')} >>\nstream\n${inhalt}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const positionen: number[] = [];
  objekte.forEach((objekt, i) => {
    positionen.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${objekt}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
  pdf += positionen
    .map((p) => `${String(p).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer\n<< /Size ${objekte.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}
