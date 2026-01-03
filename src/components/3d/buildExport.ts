import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
// PDF Build Export Utility

interface PartExportData {
  category: string;
  name: string;
  mass: number;
  nfaStatus: string;
}

interface BuildExportData {
  name: string;
  totalMass: number;
  cogDescription: string;
  parts: PartExportData[];
}

export const generateBuildExport = async (
  buildData: BuildExportData,
  canvasElement: HTMLElement | null
): Promise<void> => {
  const doc = new jsPDF("p", "mm", "a4");
  const timestamp = new Date().toLocaleString();

  // Header
  doc.setFontSize(22);
  doc.text("Custom Firearm Build Specification", 10, 20);
  doc.setFontSize(10);
  doc.text(`Generated on: ${timestamp}`, 10, 28);

  let currentY = 35;

  // 1. Capture the 3D Render if canvas is available
  if (canvasElement) {
    try {
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: "#1a1a1a",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 10, currentY, 190, 100);
      currentY = 145;
    } catch (error) {
      console.error("Failed to capture 3D view:", error);
      currentY = 40;
    }
  } else {
    currentY = 40;
  }

  // 2. Build Statistics (Weight & Balance)
  doc.setFontSize(14);
  doc.text("Build Statistics", 10, currentY);
  doc.setFontSize(11);
  doc.text(`Total Mass: ${(buildData.totalMass * 2.20462).toFixed(2)} lbs (${buildData.totalMass.toFixed(3)} kg)`, 15, currentY + 10);
  doc.text(`Balance Point: ${buildData.cogDescription}`, 15, currentY + 17);
  currentY += 30;

  // 3. Parts List Table
  autoTable(doc, {
    startY: currentY,
    head: [["Category", "Part Name", "Mass (lbs)", "Legal Status"]],
    body: buildData.parts.map((p) => [
      p.category,
      p.name,
      (p.mass * 2.20462).toFixed(3),
      p.nfaStatus,
    ]),
    theme: "striped",
    headStyles: { fillColor: [60, 60, 60] },
  });

  // 4. LEGAL COMPLIANCE DISCLAIMER
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setTextColor(200, 0, 0);
  doc.text("LEGAL COMPLIANCE & SAFETY WARNING", 10, finalY);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const disclaimer = `WARNING: This document is a digital prototype for a 1:2 scale non-functional model. 
Any attempt to scale this design to 1:1 or use it for live-fire manufacturing may violate 
state and federal laws (NFA/ITAR). 2026 UPDATE: Under the OBBBA, certain NFA items 
may have $0 tax but still require ATF registration. Consult a licensed FFL gunsmith.`;

  doc.text(disclaimer, 10, finalY + 5, { maxWidth: 180 });

  doc.save(`${buildData.name}_Specs.pdf`);
};
