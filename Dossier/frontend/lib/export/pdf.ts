import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Presentation } from '@/types/presentation';

export interface ExportOptions {
  includeNotes?: boolean;
  quality?: number; // 0.1 to 1.0
  format?: 'a4' | 'letter' | 'presentation';
}

/**
 * Export presentation to PDF
 */
export async function exportToPDF(
  presentation: Presentation,
  slideElements: HTMLElement[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    quality = 0.95,
  } = options;

  // PDF dimensions (16:9 aspect ratio for presentations)
  const pdfWidth = 297; // mm (A4 landscape width)
  const pdfHeight = 167; // mm (16:9 ratio)

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  });

  let isFirstPage = true;

  for (let i = 0; i < slideElements.length; i++) {
    const slideElement = slideElements[i];
    if (!slideElement) {
      console.warn(`Slide element ${i} is null, skipping`);
      continue;
    }

    try {
      console.log(`Capturing slide ${i + 1}/${slideElements.length}...`);

      // Ensure element is visible and rendered
      slideElement.style.visibility = 'visible';
      slideElement.style.display = 'block';

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 50));

      // Capture slide as canvas with explicit options
      const canvas = await html2canvas(slideElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        width: 1920,
        height: 1080,
        windowWidth: 1920,
        windowHeight: 1080,
        backgroundColor: null, // Let the element's background show through
      });

      console.log(`Canvas captured: ${canvas.width}x${canvas.height}`);

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/jpeg', quality);

      // Calculate dimensions to fit PDF page
      const imgWidth = pdfWidth;
      const imgHeight = pdfHeight;

      // Add new page (except for first page)
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // Add image to PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      console.log(`Slide ${i + 1} added to PDF`);

    } catch (err) {
      console.error(`Error rendering slide ${i + 1}:`, err);
      alert(`Failed to capture slide ${i + 1}. Continuing with remaining slides...`);
    }
  }

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${presentation.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}.pdf`;

  // Download PDF
  console.log(`Saving PDF as ${filename}`);
  pdf.save(filename);
}

/**
 * Export single slide to PDF
 */
export async function exportSlideToPDF(
  slideElement: HTMLElement,
  slideName: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167],
  });

  const canvas = await html2canvas(slideElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#0a0a0a',
  });

  const imgData = canvas.toDataURL('image/png', 0.95);
  const imgWidth = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

  const filename = `${slideName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
  pdf.save(filename);
}
