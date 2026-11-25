import { AlertTriangle, FileLock2, MapPin, Navigation, PhoneCall, Radio, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EvidenceEntry, RadiusMeters, SafeZone, SosStatus, VerifiedHelper } from "@/types/safety";

interface LiveSosRadarProps {
  status: SosStatus;
  isLoudStrobe: boolean;
  radiusMeters: RadiusMeters;
  escalationSecondsLeft: number;
  helpers: VerifiedHelper[];
  safeZones: SafeZone[];
  evidenceLog: EvidenceEntry[];
  onRequestCancelSos: () => void;
  onSimulateHelperAccept: () => void;
  onSelectSafeZone: (zone: SafeZone) => void;
}

function polarToXY(distanceMeters: number, bearingDeg: number, maxMeters: number) {
  const clamped = Math.min(distanceMeters, maxMeters);
  const r = (clamped / maxMeters) * 86;
  const rad = ((bearingDeg - 90) * Math.PI) / 180;
  return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) };
}

export function LiveSosRadar({
  status,
  isLoudStrobe,
  radiusMeters,
  escalationSecondsLeft,
  helpers,
  safeZones,
  evidenceLog,
  onRequestCancelSos,
  onSimulateHelperAccept,
  onSelectSafeZone,
}: LiveSosRadarProps) {
  const acceptedHelpers = helpers.filter((h) => h.accepted);
  const visibleHelpers = helpers.filter((h) => h.distanceMeters <= radiusMeters);
  const isDuress = status === "duress_active";

  return (
    <div className={`flex flex-col gap-4 rounded-2xl pb-4 ${isLoudStrobe ? "animate-sos-strobe p-2" : ""}`}>
      {/* Active Banner */}
      <section className="rounded-xl border border-primary/60 bg-primary/15 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="size-4 animate-pulse text-primary" />
            <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">
              {isDuress ? "FORCED CANCEL - HIGH RISK" : "LIVE SOS ACTIVE"}
            </span>
          </div>
          <span className="rounded-full bg-primary/20 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
            {radiusMeters}m
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href="tel:112"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PhoneCall className="size-4" />
            Call 112
          </a>
          <Button type="button" variant="secondary" onClick={onRequestCancelSos} className="font-semibold">
            Resolve (PIN)
          </Button>
        </div>
      </section>

      {/* Interactive 200m Helper Radar */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold">Nearby Helper Radar</h2>
          <span className="font-mono text-xs text-safe">
            {acceptedHelpers.length}/3 verified accepted
          </span>
        </div>

        <div className="relative mx-auto my-3 aspect-square w-full max-w-[240px]">
          <svg viewBox="0 0 200 200" className="size-full">
            <circle cx="100" cy="100" r="88" className="fill-background stroke-border" strokeWidth="1" />
            <circle cx="100" cy="100" r="58" className="fill-none stroke-border" strokeDasharray="3 3" strokeWidth="1" />
            <circle cx="100" cy="100" r="30" className="fill-none stroke-border" strokeDasharray="3 3" strokeWidth="1" />
            <g className="origin-center animate-radar-spin">
              <line x1="100" y1="100" x2="100" y2="12" className="stroke-safe/60" strokeWidth="2" />
            </g>
            {safeZones.map((zone) => {
              const pt = polarToXY(zone.distanceMeters, zone.bearingDeg, radiusMeters);
              return (
                <rect
                  key={zone.id}
                  x={pt.x - 4}
                  y={pt.y - 4}
                  width="8"
                  height="8"
                  rx="2"
                  className="fill-warning"
                />
              );
            })}
            {visibleHelpers.map((helper) => {
              const pt = polarToXY(helper.distanceMeters, helper.bearingDeg, radiusMeters);
              return (
                <circle
                  key={helper.id}
                  cx={pt.x}
                  cy={pt.y}
                  r={helper.accepted ? 6 : 4}
                  className={helper.accepted ? "fill-safe" : "fill-muted-foreground"}
                />
              );
            })}
            <circle cx="100" cy="100" r="7" className="fill-primary" />
          </svg>
        </div>

        {/* Dynamic Radius Escalation */}
        <div className="rounded-lg border border-border bg-background/70 p-2.5 text-xs">
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5 text-foreground">
              <AlertTriangle className="size-3.5 text-warning" />
              Radius Escalation: 150m → 200m → 500m
            </span>
            {acceptedHelpers.length < 3 && radiusMeters < 500 ? (
              <span className="font-mono text-warning">+{escalationSecondsLeft}s</span>
            ) : (
              <span className="font-mono text-safe">
                {acceptedHelpers.length >= 3 ? "Target met" : "Max 500m"}
              </span>
            )}
          </div>
          {acceptedHelpers.length < 3 && (
            <button
              type="button"
              onClick={onSimulateHelperAccept}
              className="mt-1.5 text-[11px] font-medium text-safe underline underline-offset-2"
            >
              Demo: Simulate another verified helper accepting
            </button>
          )}
        </div>
      </section>

      {/* Live Responder Tracker */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-display text-sm font-semibold">Live Responder Tracker</h2>
        <div className="mt-2.5 space-y-2">
          {acceptedHelpers.map((helper) => (
            <div
              key={helper.id}
              className="flex items-center justify-between rounded-lg border border-safe/25 bg-safe/10 px-3 py-2.5"
            >
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <ShieldCheck className="size-3.5 text-safe" />
                  {helper.displayName}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {helper.distanceMeters}m away · ETA {helper.etaMinutes} min
                </p>
              </div>
              <span className="rounded-full bg-safe/20 px-2.5 py-1 text-[11px] font-semibold text-safe">
                {helper.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Nearest 24/7 Safe Zones */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-display text-sm font-semibold">Nearest 24/7 Safe Zones</h2>
        <div className="mt-2.5 space-y-2">
          {safeZones.map((zone) => (
            <div
              key={zone.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2.5"
            >
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <MapPin className="size-3.5 text-warning" />
                  {zone.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {zone.category} · {zone.distanceMeters}m ({zone.walkingMinutes} min walk)
                </p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={() => onSelectSafeZone(zone)}>
                <Navigation className="size-3.5" />
                Go
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Encrypted Evidence Log */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold">
            <FileLock2 className="size-4 text-safe" />
            Encrypted Evidence Log
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">Every 5s</span>
        </div>
        <div className="mt-2.5 max-h-40 space-y-1.5 overflow-y-auto">
          {evidenceLog.map((entry) => (
            <div
              key={entry.id}
              className="rounded-md border border-border bg-background/70 px-2.5 py-2 font-mono text-[11px]"
            >
              <div className="flex justify-between text-foreground">
                <span>{entry.timestamp}</span>
                <span className="text-safe">{entry.hash}</span>
              </div>
              <p className="mt-0.5 text-muted-foreground">
                GPS: {entry.gpsSummary} · {entry.audioStatus} · {entry.photoStatus}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}