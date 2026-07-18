import { Colors } from './theme';
import type { ReportType } from '../types/report.types';

export const REPORT_TYPE_ICON: Record<ReportType, string> = {
  LAB_RESULT:     'flask',
  PRESCRIPTION:   'pill',
  VISIT_NOTE:     'clipboard-text',
  PROGRESS_IMAGE: 'image',
  OTHER:          'file-document',
};

export const REPORT_TYPE_COLOR: Record<ReportType, string> = {
  LAB_RESULT:     Colors.info,
  PRESCRIPTION:   Colors.primary,
  VISIT_NOTE:     Colors.success,
  PROGRESS_IMAGE: '#8b5cf6',
  OTHER:          Colors.neutral,
};

export const REPORT_TYPE_BG: Record<ReportType, string> = {
  LAB_RESULT:     '#EFF6FF',
  PRESCRIPTION:   Colors.primarySurface,
  VISIT_NOTE:     '#F0FDF4',
  PROGRESS_IMAGE: '#F5F3FF',
  OTHER:          Colors.neutralLight,
};

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  LAB_RESULT:     'Lab Result',
  PRESCRIPTION:   'Prescription',
  VISIT_NOTE:     'Visit Note',
  PROGRESS_IMAGE: 'Progress Image',
  OTHER:          'Other',
};
