// Registration Types and Utilities
export type RegistrationType = 'normal' | 'faithbox' | 'kids';

export interface RegistrationConfig {
  type: RegistrationType;
  title: string;
  titleTelugu: string;
  description: string;
  fee: number;
  requiresFaithbox: boolean;
}

export const REGISTRATION_CONFIGS: Record<RegistrationType, RegistrationConfig> = {
  normal: {
    type: 'normal',
    title: 'Normal Registration',
    titleTelugu: '',
    description: 'Standard camp registration',
    fee: 500,
    requiresFaithbox: false,
  },
  faithbox: {
    type: 'faithbox',
    title: 'Faithbox Registration',
    titleTelugu: 'ఫెయిత్ బాక్స్ రిజిస్ట్రేషన్',
    description: 'Registration for faithbox supporters',
    fee: 250,
    requiresFaithbox: true,
  },
  kids: {
    type: 'kids',
    title: 'Kids Registration',
    titleTelugu: 'పిల్లల రిజిస్ట్రేషన్',
    description: 'Registration for children',
    fee: 300,
    requiresFaithbox: false,
  },
};

export const CAMP_GROUPS = [
  'Group A',
  'Group B',
  'Group C',
  'Group D',
  'Group E',
  'Group F',
  'Group G',
  'Group H',
  'Group I',
  'Group J',
] as const;

export type CampGroup = typeof CAMP_GROUPS[number];

// Generate random registration ID (e.g., YC26AA05)
export function generateRegId(campId: string): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array.from({ length: 2 }, () => 
    letters[Math.floor(Math.random() * letters.length)]
  ).join('');
  const randomNumbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${campId}${randomLetters}${randomNumbers}`;
}
