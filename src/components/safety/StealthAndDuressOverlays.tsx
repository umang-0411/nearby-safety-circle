import { useEffect, useState } from "react";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StealthClockOverlayProps {
  onRequestPinUnlock: () => void;
}

export function StealthClockOverlay({ onRequestPinUnlock }: StealthClockOverlayProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-background/98 px-6 py-16 text-center">
      <div className="mt-8">
        <Lock className="mx-auto size-5 text-muted-foreground/60" />
        <p className="mt-4 font-display text-7xl font-semibold tracking-tight tabular-nums text-foreground/85">
          {timeStr}
        </p>
        <p className="mt-2 text-sm text-muted-foreground/75">{dateStr}</p>
      </div>
      <button
        type="button"
        onClick={onRequestPinUnlock}
        className="rounded-full border border-border/50 px-5 py-2 text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
      >
        Tap to unlock
      </button>
    </div>
  );
}

interface FakeCanceledOverlayProps {
  onInspectResponderView: () => void;
  onRequestRealCancel: () => void;
}

export function FakeCanceledOverlay({
  onInspectResponderView,
  onRequestRealCancel,
}: FakeCanceledOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-background px-6 py-14 text-center">
      <div className="mt-12 flex max-w-xs flex-col items-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-safe/15 text-safe">
          <CheckCircle2 className="size-9" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-foreground">Alert Canceled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your SOS alert has been closed and live location sharing is turned off.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-safe" />
          SafeCircle 200 is back in standby
        </div>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={onInspectResponderView}
          className="text-xs text-muted-foreground/60 underline underline-offset-4 hover:text-foreground"
        >
          Demo: View hidden FORCED CANCEL responder status
        </button>
        <button
          type="button"
          onClick={onRequestRealCancel}
          className="text-xs text-muted-foreground/50 hover:text-foreground"
        >
          Enter Primary PIN to actually resolve
        </button>
      </div>
    </div>
  );
}

interface PinModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  error: string | null;
  onSubmit: (pin: string) => void;
  onClose: () => void;
}

export function PinModal({ open, title, subtitle, error, onSubmit, onClose }: PinModalProps) {
  const [digits, setDigits] = useState("");

  useEffect(() => {
    if (open) setDigits("");
  }, [open]);

  if (!open) return null;

  const pushDigit = (d: string) => {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === 4) {
      onSubmit(next);
      setDigits("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/85 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        <div className="my-4 flex justify-center gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`size-3.5 rounded-full border ${
                idx < digits.length ? "border-foreground bg-foreground" : "border-muted-foreground"
              }`}
            />
          ))}
        </div>
        {error && <p className="mb-3 text-center text-xs font-medium text-primary">{error}</p>}
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Back"].map((key) => (
            <Button
              key={key}
              type="button"
              variant="secondary"
              onClick={() => {
                if (key === "Clear") setDigits("");
                else if (key === "Back") setDigits((v) => v.slice(0, -1));
                else pushDigit(key);
              }}
              className="h-12 font-mono text-base font-semibold"
            >
              {key}
            </Button>
          ))}
        </div>
        <Button type="button" variant="ghost" onClick={onClose} className="mt-3 w-full text-xs">
          Dismiss
        </Button>
      </div>
    </div>
  );
}