import type { Urgency, Gender } from './useNewBooking.types';

export interface Step3Values {
  date: string;
  time: string;
  urgency: Urgency;
  gender: Gender;
  instructions: string;
}

import type { ReactNode } from 'react';

export interface Props extends Step3Values {
  doctorPicker?: ReactNode;
  onChange: (patch: Partial<Step3Values>) => void;
  onBack?: () => void;
  onNext?: () => void;
}
