export interface AnimalReport {
  animalType: string;
  age: 'baby' | 'young' | 'adult' | 'senior';
  appearance: {
    color: string;
    hasInjury: boolean;
    injuryDescription?: string;
    otherFeatures?: string;
  };
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  foundTime: string; // ISO string
  status: 'dangerous' | 'friendly' | 'scared' | 'other';
  statusDescription: string;
  contactInfo: {
    name: string;
    phone: string;
    email?: string;
  };
}

export interface ReportResponse {
  id: string;
  message: string;
}
