import { useState } from "react";
import { CheckCircle2, FileBadge, Lock, Phone, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getVisibleLocationForHelper } from "@/lib/device-safety";
import { isHelperFullyVerified } from "@/lib/safety-store";
import type { GeoPoint, HelperVerificationState, ResponderStatus, SosStatus } from "@/types/safety";

interface HelperTabProps {
  verification: HelperVerificationState;
  onUpdateVerification: (next: HelperVerificationState) => void;
  sosStatus: SosStatus;
  victimLocation: GeoPoint | null;
  myResponderStatus: ResponderStatus;
  onResponderStatusChange: (status: ResponderStatus) => void;
}

export function HelperTab({
  verification,
  onUpdateVerification,
  sosStatus,
  victimLocation,
  myResponderStatus,
  onResponderStatusChange,
}: HelperTabProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const fullyVerified = isHelperFullyVerified(verification);
  const visibleCoords = getVisibleLocationForHelper(sosStatus, fullyVerified, victimLocation);
  const isSosActive = sosStatus === "active" || sosStatus === "duress_active";

  const handleVerifyOtp = () => {
    if (otpInput.trim() !== "200200") {
      setOtpError("Enter demo OTP code 200200 to verify.");
      return;
    }
    setOtpError(null);
    onUpdateVerification({ ...verification, otpVerified: true });
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Availability Toggle */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Available Community Helper
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Receive verified SOS alerts within 200m of your area.
            </p>
          </div>
          <Switch
            checked={fullyVerified && verification.isAvailable}
            disabled={!fullyVerified}
            onCheckedChange={(checked) =>
              onUpdateVerification({ ...verification, isAvailable: checked })
            }
            aria-label="Toggle Available Community Helper"
          />
        </div>
        {!fullyVerified && (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-warning">
            <Lock className="size-3.5" />
            Complete all 3 trust steps below to unlock Helper Mode.
          </p>
        )}
      </section>

      {/* 3-Step Trust & Verification Onboarding */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-display text-sm font-semibold">Trust & Verification Onboarding</h2>

        {/* Step 1: Phone OTP */}
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Phone className="size-4 text-safe" />
              1. Phone OTP Verification
            </span>
            {verification.otpVerified && <CheckCircle2 className="size-4 text-safe" />}
          </div>
          {!verification.otpVerified && (
            <div className="mt-2.5 space-y-2">
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="+1 555 019 2834"
                  value={verification.phone}
                  onChange={(e) => onUpdateVerification({ ...verification, phone: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={verification.phone.trim().length < 7}
                  onClick={() => setOtpSent(true)}
                >
                  Send OTP
                </Button>
              </div>
              {otpSent && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">
                    Simulated SMS sent. Enter code <span className="font-mono text-foreground">200200</span>.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="200200"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-sm"
                    />
                    <Button type="button" size="sm" onClick={handleVerifyOtp}>
                      Verify
                    </Button>
                  </div>
                  {otpError && <p className="text-xs text-primary">{otpError}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Government ID Upload */}
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <FileBadge className="size-4 text-safe" />
              2. Government ID (KYC)
            </span>
            {verification.govIdVerified && <CheckCircle2 className="size-4 text-safe" />}
          </div>
          {!verification.govIdVerified ? (
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Upload national ID or driver&apos;s license placeholder.
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  onUpdateVerification({
                    ...verification,
                    govIdFileName: "gov-id-verified-demo.pdf",
                    govIdVerified: true,
                  })
                }
              >
                Upload ID
              </Button>
            </div>
          ) : (
            <p className="mt-1 font-mono text-xs text-safe">Verified: {verification.govIdFileName}</p>
          )}
        </div>

        {/* Step 3: Emergency Contact */}
        <div className="rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <UserCheck className="size-4 text-safe" />
              3. Emergency Contact
            </span>
            {verification.emergencyContactName.trim().length > 1 &&
              verification.emergencyContactPhone.trim().length >= 7 && (
                <CheckCircle2 className="size-4 text-safe" />
              )}
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Contact name"
              value={verification.emergencyContactName}
              onChange={(e) =>
                onUpdateVerification({ ...verification, emergencyContactName: e.target.value })
              }
              className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
            />
            <input
              type="tel"
              placeholder="Contact phone"
              value={verification.emergencyContactPhone}
              onChange={(e) =>
                onUpdateVerification({ ...verification, emergencyContactPhone: e.target.value })
              }
              className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
            />
          </div>
        </div>
      </section>

      {/* Nearby SOS Alerts Feed (Zero-Exposure Privacy) */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold">Nearby SOS Alerts (200m)</h2>
          <ShieldCheck className="size-4 text-safe" />
        </div>
        {!fullyVerified ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Alerts are hidden until your KYC verification is complete.
          </p>
        ) : !isSosActive ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No active SOS alerts nearby. Zero-exposure privacy: inactive users&apos; addresses and
            coordinates are never shown.
          </p>
        ) : (
          <div className="mt-3 rounded-lg border border-primary/50 bg-primary/10 p-3">
            <p className="text-xs font-bold uppercase text-primary">
              {sosStatus === "duress_active"
                ? "FORCED CANCEL - HIGH RISK (Silent Active)"
                : "Active SOS within 200m"}
            </p>
            <p className="mt-1 font-mono text-xs text-foreground">
              Live Coords: {visibleCoords ?? "Redacted"}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(["On my way", "Calling police", "At safe spot"] as const).map((badge) => (
                <Button
                  key={badge}
                  type="button"
                  size="sm"
                  variant={myResponderStatus === badge ? "default" : "secondary"}
                  onClick={() => onResponderStatusChange(badge)}
                  className="text-xs"
                >
                  {badge}
                </Button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}