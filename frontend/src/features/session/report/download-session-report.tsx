import { Font, pdf } from '@react-pdf/renderer';
import { downloadBlob } from '@/lib/download';
import { SessionReportPdf } from './SessionReportPdf';
import { reportFileName, type SessionReport } from './session-report';

Font.registerHyphenationCallback((word) => [word]);

export function renderSessionReport(report: SessionReport): Promise<Blob> {
  return pdf(<SessionReportPdf report={report} />).toBlob();
}

export async function downloadSessionReport(report: SessionReport): Promise<void> {
  downloadBlob(reportFileName(report), await renderSessionReport(report));
}
