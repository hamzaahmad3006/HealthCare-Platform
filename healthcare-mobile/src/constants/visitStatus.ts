import { Colors } from './theme';
import type { VisitStatus } from '../types/visit.types';

export const VISIT_STATUS_COLOR: Record<VisitStatus, string> = {
  SCHEDULED:   Colors.info,
  ASSIGNED:    Colors.info,
  EN_ROUTE:    Colors.warning,
  CHECKED_IN:  Colors.primary,
  COMPLETED:   Colors.success,
  MISSED:      Colors.danger,
  CANCELLED:   Colors.danger,
};

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  SCHEDULED:   'Scheduled',
  ASSIGNED:    'Assigned',
  EN_ROUTE:    'En Route',
  CHECKED_IN:  'Checked In',
  COMPLETED:   'Completed',
  MISSED:      'Missed',
  CANCELLED:   'Cancelled',
};
