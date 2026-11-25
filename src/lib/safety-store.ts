import type {
  EvidenceEntry,
  GeoPoint,
  HelperVerificationState,
  PinConfig,
  RadiusMeters,
  SafeZone,
  VerifiedHelper,
} from "@/types/safety";

export const DEFAULT_PINS: PinConfig = {
  primaryPin: "1234",
  duressPin: "9999",
};

export const DEFAULT_VERIFICATION: HelperVerificationState = {
  phone: "",
  otpVerified: false,
  govIdFileName: null,
  govIdVerified: false,
  emergencyContactName: "",
  emergencyContactPhone: "",
  isAvailable: false,
};

export function isHelperFullyVerified(v: HelperVerificationState): boolean {
  return (
    v.otpVerified &&
    v.govIdVerified &&
    v.emergencyContactName.trim().length > 1 &&
    v.emergencyContactPhone.trim().length >= 7
  );
}

export type PinOutcome = "primary_cancel" | "duress_cancel" | "invalid";

export function evaluatePin(entered: string, config: PinConfig): PinOutcome {
  const clean = entered.trim();
  if (clean.length !== 4) return "invalid";
  if (clean === config.primaryPin) return "primary_cancel";
  if (clean === config.duressPin) return "duress_cancel";
  return "invalid";
}

export function getNextEscalatedRadius(
  currentRadius: RadiusMeters,
  acceptedHelperCount: number,
  elapsedSecondsInStage: number,
): RadiusMeters {
  if (acceptedHelperCount >= 3 || elapsedSecondsInStage < 20) {
    return currentRadius;
  }
  if (currentRadius === 150) return 200;
  if (currentRadius === 200) return 500;
  return 500;
}

export function createInitialHelpers(): VerifiedHelper[] {
  return [
    { id: "h-1", displayName: "Ananya R.", distanceMeters: 85, etaMinutes: 1, bearingDeg: 42, verified: true, accepted: true, status: "On my way" },
    { id: "h-2", displayName: "Marcus T.", distanceMeters: 135, etaMinutes: 2, bearingDeg: 148, verified: true, accepted: true, status: "Calling police" },
    { id: "h-3", displayName: "Priya K.", distanceMeters: 185, etaMinutes: 3, bearingDeg: 265, verified: true, accepted: false, status: "Notified" },
    { id: "h-4", displayName: "David L.", distanceMeters: 340, etaMinutes: 5, bearingDeg: 318, verified: true, accepted: false, status: "Notified" },
  ];
}

export function createSafeZones(): SafeZone[] {
  return [
    { id: "sz-1", name: "MetroCare 24/7 Pharmacy", category: "Pharmacy 24/7", distanceMeters: 110, bearingDeg: 75, walkingMinutes: 2, openHours: "Open 24/7" },
    { id: "sz-2", name: "Civic Plaza Police Booth", category: "Police Booth", distanceMeters: 165, bearingDeg: 210, walkingMinutes: 3, openHours: "Staffed 24/7" },
    { id: "sz-3", name: "Central Station Lit Platform", category: "Lit Transit Stop", distanceMeters: 190, bearingDeg: 330, walkingMinutes: 3, openHours: "CCTV + 24/7" },
  ];
}

export function createEvidenceEntry(step: number, loc: GeoPoint): EvidenceEntry {
  const hashSeed = `${step}-${loc.lat}-${loc.lng}`;
  let hashNum = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hashNum = (hashNum * 31 + hashSeed.charCodeAt(i)) >>> 0;
  }
  return {
    id: `ev-${step}-${hashNum.toString(16)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    gpsSummary: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} (${loc.source.toUpperCase()})`,
    audioStatus: "Recording (Encrypted)",
    photoStatus: step % 2 === 0 ? "Frame hashed" : "Queued",
    hash: `SHA256:${hashNum.toString(16).padStart(8, "0").toUpperCase()}`,
  };
}