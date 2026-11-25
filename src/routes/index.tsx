import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LocateFixed, Shield, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { PanicScreen } from "@/components/safety/PanicScreen";
import { LiveSosRadar } from "@/components/safety/LiveSosRadar";
import { HelperTab } from "@/components/safety/HelperTab";
import {
  FakeCanceledOverlay,
  PinModal,
  StealthClockOverlay,
} from "@/components/safety/StealthAndDuressOverlays";
import {
  createMockLocation,
  requestLiveLocation,
  startDeterrentAlarm,
  stopDeterrentAlarm,
  triggerHaptic,
} from "@/lib/device-safety";
import {
  createEvidenceEntry,
  createInitialHelpers,
  createSafeZones,
  DEFAULT_PINS,
  DEFAULT_VERIFICATION,
  evaluatePin,
  getNextEscalatedRadius,
} from "@/lib/safety-store";
import type {
  EvidenceEntry,
  GeoPoint,
  HelperVerificationState,
  PinConfig,
  RadiusMeters,
  ResponderStatus,
  SafeZone,
  SosMode,
  SosStatus,
  VerifiedHelper,
} from "@/types/safety";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeCircle 200 — Hyperlocal Citizen Safety" },
      {
        name: "description",
        content:
          "Mobile-first 200-meter verified community safety network with SOS radar, stealth mode, walk-with-me timer, and duress PIN protection.",
      },
      { property: "og:title", content: "SafeCircle 200 — Hyperlocal Citizen Safety" },
      {
        property: "og:description",
        content:
          "Mobile-first 200-meter verified community safety network with SOS radar, stealth mode, and duress PIN protection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SafeCircleApp,
});

function SafeCircleApp() {
  const [activeTab, setActiveTab] = useState<"panic" | "helper">("panic");
  const [mode, setMode] = useState<SosMode>("loud");
  const [sosStatus, setSosStatus] = useState<SosStatus>("idle");
  const [armingSecondsLeft, setArmingSecondsLeft] = useState<number | null>(null);
  const [walkTimerSeconds, setWalkTimerSeconds] = useState<number | null>(null);
  const [pinConfig, setPinConfig] = useState<PinConfig>(DEFAULT_PINS);
  const [pinModalTarget, setPinModalTarget] = useState<"sos" | "timer" | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [showFakeCanceled, setShowFakeCanceled] = useState(false);
  const [showStealthClock, setShowStealthClock] = useState(false);

  const [useMockGps, setUseMockGps] = useState(true);
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [radiusMeters, setRadiusMeters] = useState<RadiusMeters>(150);
  const [escalationElapsed, setEscalationElapsed] = useState(0);
  const [helpers, setHelpers] = useState<VerifiedHelper[]>(() => createInitialHelpers());
  const [safeZones] = useState<SafeZone[]>(() => createSafeZones());
  const [evidenceLog, setEvidenceLog] = useState<EvidenceEntry[]>([]);
  const [verification, setVerification] = useState<HelperVerificationState>(DEFAULT_VERIFICATION);
  const [myResponderStatus, setMyResponderStatus] = useState<ResponderStatus>("On my way");

  const isSosActive = sosStatus === "active" || sosStatus === "duress_active";

  const activateSos = () => {
    const initialLoc = createMockLocation(0);
    setLocation(initialLoc);
    setSosStatus("active");
    setRadiusMeters(150);
    setEscalationElapsed(0);
    setHelpers(createInitialHelpers());
    setEvidenceLog([createEvidenceEntry(1, initialLoc)]);
    setShowFakeCanceled(false);
    triggerHaptic([200, 100, 200]);

    if (mode === "loud") {
      setShowStealthClock(false);
      const ok = startDeterrentAlarm();
      if (!ok) toast.info("Visual strobe active (browser audio blocked until tap).");
    } else {
      stopDeterrentAlarm();
      setShowStealthClock(true);
    }

    if (!useMockGps) {
      void requestLiveLocation()
        .then((live) => setLocation(live))
        .catch(() => toast.warning("GPS permission denied; using simulated GPS fallback."));
    }
  };

  const resolveSosCompletely = () => {
    stopDeterrentAlarm();
    setSosStatus("resolved");
    setLocation(null);
    setEvidenceLog([]);
    setShowFakeCanceled(false);
    setShowStealthClock(false);
    setPinModalTarget(null);
    setPinError(null);
    toast.success("SOS resolved. Live location access wiped.");
    window.setTimeout(() => setSosStatus("idle"), 200);
  };

  // 3-second pocket-dial countdown
  useEffect(() => {
    if (armingSecondsLeft === null) return;
    if (armingSecondsLeft <= 0) {
      setArmingSecondsLeft(null);
      activateSos();
      return;
    }
    const id = window.setTimeout(() => setArmingSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => window.clearTimeout(id);
  }, [armingSecondsLeft]);

  // Walk-With-Me Dead-Man's Timer
  useEffect(() => {
    if (walkTimerSeconds === null) return;
    if (walkTimerSeconds <= 0) {
      setWalkTimerSeconds(null);
      toast.error("Walk-With-Me timer expired. Triggering SOS.");
      activateSos();
      return;
    }
    const id = window.setTimeout(() => setWalkTimerSeconds((s) => (s !== null ? s - 1 : null)), 1000);
    return () => window.clearTimeout(id);
  }, [walkTimerSeconds]);

  // Dynamic radius escalation (150m -> 200m -> 500m if < 3 helpers accept within 20s)
  useEffect(() => {
    if (!isSosActive) return;
    const id = window.setInterval(() => {
      setEscalationElapsed((prev) => {
        const nextSec = prev + 1;
        const acceptedCount = helpers.filter((h) => h.accepted).length;
        const nextRadius = getNextEscalatedRadius(radiusMeters, acceptedCount, nextSec);
        if (nextRadius !== radiusMeters) {
          setRadiusMeters(nextRadius);
          toast.warning(`Radius expanded to ${nextRadius}m to reach 3 verified helpers.`);
          return 0;
        }
        return nextSec;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isSosActive, radiusMeters, helpers]);

  // Encrypted evidence breadcrumbs every 5 seconds
  useEffect(() => {
    if (!isSosActive) return;
    let step = 2;
    const id = window.setInterval(() => {
      const nextLoc = createMockLocation(step);
      if (useMockGps) setLocation(nextLoc);
      setEvidenceLog((prev) => [createEvidenceEntry(step, location ?? nextLoc), ...prev].slice(0, 12));
      step += 1;
    }, 5000);
    return () => window.clearInterval(id);
  }, [isSosActive, useMockGps]);

  useEffect(() => () => stopDeterrentAlarm(), []);

  const handlePinSubmit = (entered: string) => {
    const outcome = evaluatePin(entered, pinConfig);
    if (outcome === "invalid") {
      setPinError("Incorrect 4-digit PIN.");
      return;
    }
    setPinError(null);
    if (pinModalTarget === "timer") {
      if (outcome === "primary_cancel") {
        setWalkTimerSeconds(null);
        setPinModalTarget(null);
        toast.success("Walk-With-Me timer canceled.");
      } else {
        setWalkTimerSeconds(null);
        setPinModalTarget(null);
        activateSos();
        setSosStatus("duress_active");
        setShowFakeCanceled(true);
      }
      return;
    }
    if (outcome === "primary_cancel") {
      resolveSosCompletely();
    } else if (outcome === "duress_cancel") {
      stopDeterrentAlarm();
      setSosStatus("duress_active");
      setPinModalTarget(null);
      setShowStealthClock(false);
      setShowFakeCanceled(true);
    }
  };

  const handleSimulateHelperAccept = () => {
    setHelpers((prev) => {
      const idx = prev.findIndex((h) => !h.accepted);
      if (idx === -1) return prev;
      return prev.map((h, i) => (i === idx ? { ...h, accepted: true, status: "On my way" } : h));
    });
  };

  const handleSelectSafeZone = (zone: SafeZone) => {
    toast.info(`Directions to ${zone.name} (${zone.distanceMeters}m, ${zone.walkingMinutes} min walk)`);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background text-foreground">
      {/* Compact Top Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-safe" />
          <span className="font-display text-base font-bold tracking-tight">SafeCircle 200</span>
        </div>
        <button
          type="button"
          onClick={() => setUseMockGps((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <LocateFixed className={`size-3.5 ${useMockGps ? "text-warning" : "text-safe"}`} />
          {useMockGps ? "Mock GPS" : "Live GPS"}
        </button>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 px-4 pt-4 pb-20">
        {activeTab === "panic" ? (
          isSosActive ? (
            <LiveSosRadar
              status={sosStatus}
              isLoudStrobe={mode === "loud" && sosStatus === "active"}
              radiusMeters={radiusMeters}
              escalationSecondsLeft={Math.max(0, 20 - escalationElapsed)}
              helpers={helpers}
              safeZones={safeZones}
              evidenceLog={evidenceLog}
              onRequestCancelSos={() => setPinModalTarget("sos")}
              onSimulateHelperAccept={handleSimulateHelperAccept}
              onSelectSafeZone={handleSelectSafeZone}
            />
          ) : (
            <PanicScreen
              mode={mode}
              onModeChange={setMode}
              armingSecondsLeft={armingSecondsLeft}
              onBeginArming={() => {
                triggerHaptic(80);
                setArmingSecondsLeft(3);
              }}
              onCancelArming={() => setArmingSecondsLeft(null)}
              walkTimerSeconds={walkTimerSeconds}
              onStartWalkTimer={(mins) => {
                setWalkTimerSeconds(mins * 60);
                toast.info(`Walk-With-Me timer set for ${mins} minutes.`);
              }}
              onRequestCancelWalkTimer={() => setPinModalTarget("timer")}
              pinConfig={pinConfig}
              onUpdatePins={(next) => {
                setPinConfig(next);
                toast.success("Safety & Duress PINs updated.");
              }}
            />
          )
        ) : (
          <HelperTab
            verification={verification}
            onUpdateVerification={setVerification}
            sosStatus={sosStatus}
            victimLocation={location}
            myResponderStatus={myResponderStatus}
            onResponderStatusChange={(status) => {
              setMyResponderStatus(status);
              toast.success(`Responder status updated: ${status}`);
            }}
          />
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-2 border-t border-border bg-card/95 backdrop-blur"
      >
        <button
          type="button"
          onClick={() => setActiveTab("panic")}
          className={`flex flex-col items-center gap-1 py-2.5 text-xs font-semibold ${
            activeTab === "panic" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <ShieldAlert className="size-5" />
          {isSosActive ? "Live SOS" : "SOS Panic"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("helper")}
          className={`flex flex-col items-center gap-1 py-2.5 text-xs font-semibold ${
            activeTab === "helper" ? "text-safe" : "text-muted-foreground"
          }`}
        >
          <Users className="size-5" />
          Helper Mode
        </button>
      </nav>

      {/* Overlays */}
      {showStealthClock && isSosActive && (
        <StealthClockOverlay onRequestPinUnlock={() => setPinModalTarget("sos")} />
      )}
      {showFakeCanceled && sosStatus === "duress_active" && (
        <FakeCanceledOverlay
          onInspectResponderView={() => setShowFakeCanceled(false)}
          onRequestRealCancel={() => setPinModalTarget("sos")}
        />
      )}
      <PinModal
        open={pinModalTarget !== null}
        title={pinModalTarget === "timer" ? "Cancel Walk-With-Me Timer" : "Enter Safety PIN"}
        subtitle="Enter your 4-digit Primary PIN to cancel."
        error={pinError}
        onSubmit={handlePinSubmit}
        onClose={() => {
          setPinModalTarget(null);
          setPinError(null);
        }}
      />
    </div>
  );
}
