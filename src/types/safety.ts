export type SosMode = "loud" | "stealth";

export type SosStatus = "idle" | "arming" | "active" | "duress_active" | "resolved";

export type RadiusMeters = 150 | 200 | 500;

export type ResponderStatus = "Notified" | "On my way" | "Calling police" | "At safe spot";

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracyMeters: number;
  source: "mock" | "gps";
  updatedAt: string;
}

export interface VerifiedHelper {
  id: string;
  displayName: string;
  distanceMeters: number;
  etaMinutes: number;
  bearingDeg: number;
  verified: boolean;
  accepted: boolean;
  status: ResponderStatus;
}

export interface SafeZone {
  id: string;
  name: string;
  category: "Pharmacy 24/7" | "Police Booth" | "Lit Transit Stop";
  distanceMeters: number;
  bearingDeg: number;
  walkingMinutes: number;
  openHours: string;
}

export interface EvidenceEntry {
  id: string;
  timestamp: string;
  gpsSummary: string;
  audioStatus: "Recording (Encrypted)" | "Standby";
  photoStatus: "Frame hashed" | "Queued";
  hash: string;
}

export interface PinConfig {
  primaryPin: string;
  duressPin: string;
}

export interface HelperVerificationState {
  phone: string;
  otpVerified: boolean;
  govIdFileName: string | null;
  govIdVerified: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  isAvailable: boolean;
}