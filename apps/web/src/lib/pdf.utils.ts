import type { IGeneratedPaper } from '@vedaai/shared';
export function buildFilename(subject: string, cls: string): string {
    const sanitize = (input: string): string => input
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/ +/g, '_');
    const sanitizedSubject = sanitize(subject);
    const sanitizedClass = sanitize(cls);
    return `${sanitizedSubject}_Class${sanitizedClass}_QuestionPaper.pdf`;
}
export async function downloadPDF(paper: IGeneratedPaper): Promise<void> {
    const { default: PDFDocument } = await import('@/components/PDFDocument');
    const { pdf } = await import('@react-pdf/renderer');
    const React = await import('react');
    const blob = await pdf(React.createElement(PDFDocument, { paper }) as any).toBlob();
    const filename = buildFilename(paper.subject, paper.class);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}
