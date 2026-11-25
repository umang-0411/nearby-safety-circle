# Nearby Safety Circle

Build a hyperlocal citizen-safety web application called "SafeCircle 200" designed for mobile viewports with a high-contrast, calm-yet-urgent dark mode UI (deep slate background, crisp white typography, crimson red for active SOS alerts, and emerald green for verified helpers).

### Core User Flows & Screens:
1. **Home / Panic Screen (Default View):**
   - Centerpiece: A large, hold-to-activate or double-tap **SOS Panic Button** with a 3-second cancel countdown to prevent pocket dials.
   - Mode Toggle above the button: Switch between **Loud Deterrent Mode** (triggers an on-screen visual strobe + Web Audio API high-pitched alarm sound) and **Silent Stealth Mode** (dims the screen to look like a locked clock screen while keeping the SOS active in the background).
   - **Walk-With-Me Dead-Man's Timer:** A quick-set countdown timer (5, 10, or 15 mins). If the user does not enter their 4-digit PIN before it hits 00:00, SOS triggers automatically.
   - **Duress PIN Logic:** Set up a primary PIN (e.g., 1234) and a fake "Duress PIN" (e.g., 9999). If the user enters the Duress PIN to cancel an active SOS, show a fake "Alert Canceled" screen while keeping the SOS active and flagging "FORCED CANCEL - HIGH RISK" to responders.

2. **Live SOS & Nearby Helper Radar (Active State):**
   - Interactive map/radar view showing a **200-meter radius circle** around the victim (use realistic simulated nearby verified helpers for the initial demo).
   - Dynamic radius escalation indicator: Starts at 150m, expands to 200m -> 500m if fewer than 3 verified helpers accept within 20 seconds, plus a one-tap **Call 112 / Emergency Services** button and nearest **24/7 Safe Zone** directions (e.g., open pharmacy, police booth, lit transit stop).
   - Live responder tracker showing accepted helpers' distance in meters, ETA, and a quick-status badge ("On my way", "Calling police", "At safe spot").
   - Encrypted Evidence Log panel: Automatically records timestamped GPS breadcrumbs and simulated audio/photo status every 5 seconds.

3. **Helper / Responder Mode & Verification Tab:**
   - Toggle switch to act as an **Available Community Helper** within 200m.
   - **Trust & Verification Onboarding:** A multi-step verification screen requiring phone OTP simulation, government ID upload placeholder, and emergency contact setup before a user can view nearby SOS alerts.

### Strict Privacy & Device Safety Rules:
- **Zero-Exposure Location Privacy:** Never display exact street addresses or live coordinates of inactive users. Only share a victim's live location with KYC-verified helpers within 200m *after* an active SOS is triggered, and automatically wipe location access once the alert is marked resolved.
- **Browser & Device Safety:** Use only standard, permission-gated browser APIs (`navigator.geolocation`, Web Audio API, and `navigator.vibrate`) with graceful fallbacks and clear user permission prompts. Do not access background contacts, storage, or unauthorized device sensors. Provide an intuitive mock/simulated GPS toggle so users can test the application safely without needing to expose real device coordinates.
- **Code & Architecture Guardrails:** Keep all state modular in clean React components with TypeScript interfaces so we can connect Supabase Auth, PostGIS geospatial queries, and Row-Level Security (RLS) in the next step without rewriting the UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1b69baeb-8cda-4448-ac1e-01eef59a7319).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
