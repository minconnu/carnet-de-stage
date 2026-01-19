
export interface DayEntry {
  id: number;
  date: string;
  description: string;
  photos: string[]; // base64 strings
}

export interface StageData {
  id: string;
  nom: string;
  prenom: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  entries: DayEntry[];
  evaluation: Record<number, string>; // Point index -> value ('Toujours', 'Souvent', etc.)
  evalComments: Record<number, string>; // Point index (20-28) -> text response
}

export type ViewState = 'cover' | 'day' | 'eval' | 'evalText';
