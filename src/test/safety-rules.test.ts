import { describe, expect, it } from "vitest";
import { getVisibleLocationForHelper } from "@/lib/device-safety";
import { DEFAULT_PINS, evaluatePin, getNextEscalatedRadius } from "@/lib/safety-store";

describe("SafeCircle 200 safety rules", () => {
  it("distinguishes Primary PIN from Duress PIN", () => {
    expect(evaluatePin("1234", DEFAULT_PINS)).toBe("primary_cancel");
    expect(evaluatePin("9999", DEFAULT_PINS)).toBe("duress_cancel");
    expect(evaluatePin("0000", DEFAULT_PINS)).toBe("invalid");
  });

  it("escalates radius 150m -> 200m -> 500m when fewer than 3 helpers accept within 20s", () => {
    expect(getNextEscalatedRadius(150, 2, 19)).toBe(150);
    expect(getNextEscalatedRadius(150, 2, 20)).toBe(200);
    expect(getNextEscalatedRadius(200, 2, 20)).toBe(500);
    expect(getNextEscalatedRadius(150, 3, 25)).toBe(150);
  });

  it("enforces zero-exposure location privacy for inactive or unverified states", () => {
    const sampleLoc = {
      lat: 37.7749,
      lng: -122.4194,
      accuracyMeters: 8,
      source: "mock" as const,
      updatedAt: "2026-11-25T03:22:00.000Z",
    };
    expect(getVisibleLocationForHelper("idle", true, sampleLoc)).toBeNull();
    expect(getVisibleLocationForHelper("resolved", true, sampleLoc)).toBeNull();
    expect(getVisibleLocationForHelper("active", false, sampleLoc)).toBeNull();
    expect(getVisibleLocationForHelper("active", true, sampleLoc)).toContain("37.7749");
    expect(getVisibleLocationForHelper("duress_active", true, sampleLoc)).toContain("37.7749");
  });
});