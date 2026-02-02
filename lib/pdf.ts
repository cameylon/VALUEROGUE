import PDFDocument from "pdfkit";

export async function generateEvidencePackPdf(content: {
  incidentId: string;
  incidentSummary: string;
  timeline: string[];
  approvals: string[];
}) {
  const doc = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  doc.fontSize(18).text("LDS Nexus Evidence Pack", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Incident ID: ${content.incidentId}`);
  doc.moveDown();
  doc.text(`Summary: ${content.incidentSummary}`);
  doc.moveDown();
  doc.text("Timeline", { underline: true });
  content.timeline.forEach((item) => {
    doc.text(`- ${item}`);
  });
  doc.moveDown();
  doc.text("Approvals", { underline: true });
  content.approvals.forEach((item) => {
    doc.text(`- ${item}`);
  });

  doc.end();

  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });
}
