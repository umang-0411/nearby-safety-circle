import type { GeoPoint, SosStatus } from "@/types/safety";

let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let sweepTimer: number | null = null;

export function startDeterrentAlarm(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const AudioContextCtor = window.AudioContext;
    if (!AudioContextCtor) return false;
    stopDeterrentAlarm();
    audioCtx = new AudioContextCtor();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(2600, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();

    let high = true;
    sweepTimer = window.setInterval(() => {
      if (!oscillator || !audioCtx) return;
      oscillator.frequency.setValueAtTime(high ? 3200 : 2400, audioCtx.currentTime);
      high = !high;
    }, 320);
    return true;
  } catch {
    return false;
  }
}

export function stopDeterrentAlarm(): void {
  if (sweepTimer !== null && typeof window !== "undefined") {
    window.clearInterval(sweepTimer);
    sweepTimer = null;
  }
  try {
    oscillator?.stop();
    oscillator?.disconnect();
    gainNode?.disconnect();
    void audioCtx?.close();
  } catch {
    // Ignore cleanup errors on already-closed contexts
  }
  oscillator = null;
  gainNode = null;
  audioCtx = null;
}

export function triggerHaptic(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

export function createMockLocation(driftStep = 0): GeoPoint {
  const jitterLat = Math.sin(driftStep * 0.7) * 0.00009;
  const jitterLng = Math.cos(driftStep * 0.7) * 0.00009;
  return {
    lat: Number((37.7749 + jitterLat).toFixed(5)),
    lng: Number((-122.4194 + jitterLng).toFixed(5)),
    accuracyMeters: 8,
    source: "mock",
    updatedAt: new Date().toISOString(),
  };
}

export function requestLiveLocation(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("Geolocation unavailable in this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          accuracyMeters: Math.round(pos.coords.accuracy),
          source: "gps",
          updatedAt: new Date().toISOString(),
        });
      },
      (err) => reject(new Error(err.message || "Location permission denied")),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 },
    );
  });
}

export function getVisibleLocationForHelper(
  status: SosStatus,
  helperVerified: boolean,
  location: GeoPoint | null,
): string | null {
  const isActiveSos = status === "active" || status === "duress_active";
  if (!isActiveSos || !helperVerified || !location) return null;
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} (±${location.accuracyMeters}m)`;
}