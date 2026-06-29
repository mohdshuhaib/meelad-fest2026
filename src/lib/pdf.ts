import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
type Row = [string, string];
export async function detailsPdf(
  subtitle: string,
  rows: Row[],
  programs?: { code: string; name: string }[],
) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const green = rgb(0.03, 0.29, 0.25),
    gold = rgb(0.82, 0.66, 0.36),
    ink = rgb(0.09, 0.15, 0.14),
    cream = rgb(0.96, 0.94, 0.89);
  page.drawRectangle({
    x: 0,
    y: height - 125,
    width,
    height: 125,
    color: green,
  });
  page.drawText("AHLU SAADA MEELAD FEST", {
    x: 48,
    y: height - 57,
    size: 22,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(subtitle, {
    x: 48,
    y: height - 83,
    size: 10,
    font: bold,
    color: gold,
  });
  let y = height - 155;
  const drawRows = (items: Row[]) => {
    items.forEach(([label, value], i) => {
      const valueLines = wrapText(safe(value), width - 285, regular, 9.5);
      const rowH = Math.max(label === "Security Notice" ? 52 : 36, 24 + valueLines.length * 11);
      page.drawRectangle({
        x: 48,
        y: y - rowH + 8,
        width: width - 96,
        height: rowH,
        color: i % 2 ? rgb(1, 1, 1) : cream,
      });
      page.drawText(label.toUpperCase(), {
        x: 60,
        y: y - 10,
        size: 7.5,
        font: bold,
        color: green,
      });
      valueLines.forEach((line, lineIndex) =>
        page.drawText(line, {
          x: 220,
          y: y - 11 - lineIndex * 11,
          size: 9.5,
          font: regular,
          color: ink,
        }),
      );
      y -= rowH;
    });
  };
  drawRows(rows);
  if (programs) {
    y -= 18;
    page.drawText("YOUR PROGRAMS", {
      x: 48,
      y,
      size: 13,
      font: bold,
      color: green,
    });
    y -= 25;
    page.drawRectangle({
      x: 48,
      y: y - 22,
      width: width - 96,
      height: 26,
      color: green,
    });
    ["SL NO", "CODE", "PROGRAMME", "OFFICIAL USE"].forEach((t, i) =>
      page.drawText(t, {
        x: [58, 100, 165, 430][i],
        y: y - 12,
        size: 7,
        font: bold,
        color: rgb(1, 1, 1),
      }),
    );
    y -= 26;
    programs.forEach((p, i) => {
      page.drawRectangle({
        x: 48,
        y: y - 24,
        width: width - 96,
        height: 26,
        color: i % 2 ? rgb(1, 1, 1) : cream,
      });
      page.drawText(String(i + 1), {
        x: 61,
        y: y - 13,
        size: 9,
        font: regular,
        color: ink,
      });
      page.drawText(safe(p.code), {
        x: 100,
        y: y - 13,
        size: 9,
        font: bold,
        color: ink,
      });
      page.drawText(safe(p.name).slice(0, 42), {
        x: 165,
        y: y - 13,
        size: 9,
        font: regular,
        color: ink,
      });
      y -= 26;
    });
  }
  page.drawText(
    `GENERATED ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date())} IST`,
    { x: 48, y: 32, size: 7, font: regular, color: rgb(0.4, 0.44, 0.43) },
  );
  page.drawText("AHLU SAADA MEELAD FEST", {
    x: width - 190,
    y: 32,
    size: 7,
    font: bold,
    color: green,
  });
  return pdf.save();
}
function safe(value: unknown) {
  return String(value ?? "-").replace(/[^\x20-\x7E]/g, "-");
}
function wrapText(value: string, maxWidth: number, font: PDFFont, size: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ["-"];
}
export function pdfResponse(bytes: Uint8Array, name: string) {
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename=\"${name}\"`,
      "cache-control": "no-store",
    },
  });
}
