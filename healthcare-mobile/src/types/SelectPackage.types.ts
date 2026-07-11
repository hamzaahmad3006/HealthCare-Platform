import type { PackageOption } from './useNewBooking.types';

export interface Props {
  packages: PackageOption[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (pkg: PackageOption) => void;
  onBack?: () => void;
  onNext?: () => void;
}
