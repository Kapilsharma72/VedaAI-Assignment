'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { IGeneratedPaper } from '@vedaai/shared';

export interface PDFDocumentWrapperProps {
  paper: IGeneratedPaper;
}

const PDFDocumentWrapper: ComponentType<PDFDocumentWrapperProps> = dynamic(
  () => import('./PDFDocument'),
  { ssr: false }
) as ComponentType<PDFDocumentWrapperProps>;

export default PDFDocumentWrapper;
