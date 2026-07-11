import type { Urgency, Gender } from './useNewBooking.types';

export interface Step3Values {
  date: string;
  time: string;
  urgency: Urgency;
  gender: Gender;
  instructions: string;
}

export interface Props extends Step3Values {
  onChange: (patch: Partial<Step3Values>) => void;
  onBack?: () => void;
  onNext?: () => void;
}
