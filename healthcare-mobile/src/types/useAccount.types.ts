export interface Address {
  id: string;
  label?: string | null;
  contactName: string;
  contactPhone: string;
  line1: string;
  line2?: string | null;
  area: string;
}

export interface Zone {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  zones: Zone[];
}

export interface NewAddressInput {
  label: string;
  contactName: string;
  contactPhone: string;
  line1: string;
  line2: string;
  area: string;
  cityId: string | null;
  zoneId: string | null;
}
