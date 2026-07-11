export interface BookingSummary {
  service: string;
  package: string;
  price: string;
  patient: string;
  address: string;
  date: string;
  time: string;
  urgency: string;
  gender: string;
  instructions: string;
}

export interface Props {
  summary: BookingSummary;
  onBack?: () => void;
  onConfirm?: () => void;
  submitting?: boolean;
}
