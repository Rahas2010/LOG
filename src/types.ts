export interface DailyData {
  spell1: number;
  spell2: number;
  spell3: number;
}

export interface AppSettings {
  maxTime: number;           // Default daily limit (minutes)
  penaltyRatio: number;      // Multiplier for excess time
  fullBlockThreshold: number; // Penalty >= this triggers full block
  carryForwardEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  maxTime: 60,
  penaltyRatio: 1.5,
  fullBlockThreshold: 60,
  carryForwardEnabled: true,
};

export interface PenaltyInfo {
  totalTime: number;
  effectiveLimit: number;
  bonusTime: number;
  excessTime: number;
  penaltyMinutes: number;
  isFullBlock: boolean;
  carryForward: number;
}

export interface AppState {
  dailyData: Record<string, DailyData>;
  blockedDates: Record<string, number>;
  selectedDate: string;
  currentMonth: number;
  currentYear: number;
  settings: AppSettings;
}

// ── Request System ──

export type RequestType = 'password_reset' | 'edit_approval';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface UserRequest {
  id: string;
  type: RequestType;
  userKey: string;
  userDisplay: string;
  timestamp: string;
  status: RequestStatus;
  // For edit_approval
  dateKey?: string;
  spellData?: DailyData;
  // For password_reset
  message?: string;
  // Admin response
  resolvedAt?: string;
  resolvedBy?: string;
}
