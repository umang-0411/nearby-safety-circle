import { useEffect, useRef, useState } from "react";
import { BellRing, Clock, EyeOff, KeyRound, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PinConfig, SosMode } from "@/types/safety";

interface PanicScreenProps {
  mode: SosMode;
  onModeChange: (mode: SosMode) => void;
  armingSecondsLeft: number | null;
  onBeginArming: () => void;
  onCancelArming: () => void;
  walkTimerSeconds: number | null;
  onStartWalkTimer: (minutes: 5 | 10 | 15) => void;
  onRequestCancelWalkTimer: () => void;
  pinConfig: PinConfig;
  onUpdatePins: (next: PinConfig) => void;
}

function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function PanicScreen({
  mode,
  onModeChange,
  armingSecondsLeft,
  onBeginArming,
  onCancelArming,
  walkTimerSeconds,
  onStartWalkTimer,
  onRequestCancelWalkTimer,
  pinConfig,
  onUpdatePins,
}: PanicScreenProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [showPinEditor, setShowPinEditor] = useState(false);
  const [primaryInput, setPrimaryInput] = useState(pinConfig.primaryPin);
  const [duressInput, setDuressInput] = useState(pinConfig.duressPin);
  const [pinError, setPinError] = useState<string | null>(null);

  const holdIntervalRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current !== null) window.clearInterval(holdIntervalRef.current);
    };
  }, []);

  const stopHold = () => {
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  const startHold = () => {
    if (armingSecondsLeft !== null) return;
    const now = Date.now();
    if (now - lastTapRef.current < 360) {
      lastTapRef.current = 0;
      stopHold();
      onBeginArming();
      return;
    }
    lastTapRef.current = now;
    const startedAt = Date.now();
    holdIntervalRef.current = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startedAt) / 1400) * 100);
      setHoldProgress(pct);
      if (pct >= 100) {
        stopHold();
        onBeginArming();
      }
    }, 30);
  };

  const handleSavePins = () => {
    const p = primaryInput.trim();
    const d = duressInput.trim();
    if (!/^\d{4}$/.test(p) || !/^\d{4}$/.test(d)) {
      setPinError("Both PINs must be exactly 4 digits.");
      return;
    }
    if (p === d) {
      setPinError("Duress PIN must differ from Primary PIN.");
      return;
    }
    setPinError(null);
    onUpdatePins({ primaryPin: p, duressPin: d });
    setShowPinEditor(false);
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Mode Toggle */}
      <section aria-label="SOS Mode">
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1.5">
          <button
            type="button"
            onClick={() => onModeChange("loud")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              mode === "loud"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BellRing className="size-4" />
            Loud Deterrent
          </button>
          <button
            type="button"
            onClick={() => onModeChange("stealth")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              mode === "stealth"
                ? "bg-secondary text-foreground ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <EyeOff className="size-4" />
            Silent Stealth
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {mode === "loud"
            ? "Triggers visual strobe + high-pitched Web Audio siren."
            : "Dims screen into a locked clock while SOS runs silently."}
        </p>
      </section>

      {/* Centerpiece SOS Panic Button */}
      <section className="flex flex-col items-center justify-center py-4">
        {armingSecondsLeft !== null ? (
          <div className="flex w-full flex-col items-center rounded-2xl border border-primary/50 bg-primary/15 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Dispatching SOS in
            </p>
            <p className="mt-1 font-display text-6xl font-bold tabular-nums text-foreground">
              {armingSecondsLeft}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pocket-dial protection active
            </p>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onCancelArming}
              className="mt-5 w-full font-semibold"
            >
              <X className="size-4" />
              Cancel Dispatch
            </Button>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <span
              aria-hidden
              className="pointer-events-none absolute size-52 rounded-full bg-primary/25 animate-sos-pulse"
            />
            <button
              type="button"
              onPointerDown={startHold}
              onPointerUp={stopHold}
              onPointerLeave={stopHold}
              onPointerCancel={stopHold}
              aria-label="SOS Panic Button. Hold or double tap to activate."
              className="relative flex size-48 select-none flex-col items-center justify-center rounded-full border-4 border-primary/60 bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
            >
              <ShieldAlert className="size-10" />
              <span className="mt-1 font-display text-3xl font-bold tracking-wider">SOS</span>
              <span className="mt-1 text-[11px] font-medium opacity-90">
                Hold 1.5s or Double-Tap
              </span>
              {holdProgress > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full border-4 border-foreground/80"
                  style={{
                    clipPath: `inset(${100 - holdProgress}% 0 0 0)`,
                  }}
                />
              )}
            </button>
          </div>
        )}
      </section>

      {/* Walk-With-Me Dead-Man's Timer */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-warning" />
            <h2 className="font-display text-sm font-semibold">Walk-With-Me Timer</h2>
          </div>
          {walkTimerSeconds !== null && (
            <span className="font-mono text-lg font-bold tabular-nums text-warning">
              {formatTimer(walkTimerSeconds)}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Auto-triggers SOS at 00:00 unless you enter your 4-digit PIN.
        </p>
        {walkTimerSeconds === null ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {([5, 10, 15] as const).map((mins) => (
              <Button
                key={mins}
                type="button"
                variant="secondary"
                onClick={() => onStartWalkTimer(mins)}
                className="font-mono text-sm font-semibold"
              >
                {mins} min
              </Button>
            ))}
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onRequestCancelWalkTimer}
            className="mt-3 w-full border-warning/40 text-warning hover:bg-warning/10"
          >
            Enter PIN to Cancel Timer
          </Button>
        )}
      </section>

      {/* PIN & Duress PIN Config */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-safe" />
            <h2 className="font-display text-sm font-semibold">Safety & Duress PINs</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowPinEditor((v) => !v)}
            className="text-xs font-medium text-safe underline-offset-4 hover:underline"
          >
            {showPinEditor ? "Close" : "Configure"}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Primary <span className="font-mono text-foreground">{pinConfig.primaryPin}</span> cancels SOS. Duress{" "}
          <span className="font-mono text-foreground">{pinConfig.duressPin}</span> shows fake cancel while flagging high risk.
        </p>
        {showPinEditor && (
          <div className="mt-3 space-y-2.5 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">
                Primary PIN
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={primaryInput}
                  onChange={(e) => setPrimaryInput(e.target.value.replace(/\D/g, ""))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Duress PIN
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={duressInput}
                  onChange={(e) => setDuressInput(e.target.value.replace(/\D/g, ""))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground"
                />
              </label>
            </div>
            {pinError && <p className="text-xs text-primary">{pinError}</p>}
            <Button type="button" size="sm" onClick={handleSavePins} className="w-full">
              Save PINs
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}