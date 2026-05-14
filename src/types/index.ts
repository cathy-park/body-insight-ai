export interface HealthRecord {
  id: string;
  date: string;
  weight: number;
  skeletal_muscle: number;
  body_fat: number;
  body_fat_mass: number;
  visceral_fat_level: number;
  abdominal_fat_ratio: number;
  waist_circumference_belly: number;
  waist_circumference_beauty: number;
  bmi: number;
  sleep_hours: number;
  alcohol_flag: boolean;
  bowel_condition: 'good' | 'normal' | 'bad';
  period_flag: boolean;
  memo: string;
  created_at: string;
}

export type NewHealthRecord = Omit<HealthRecord, 'id' | 'created_at' | 'bmi'> & { bmi?: number };

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}
