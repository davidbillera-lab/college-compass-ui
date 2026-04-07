import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // ─── App Identity ────────────────────────────────────────────────────────
  // appId must match your Apple Developer bundle ID exactly.
  // Update this to match what you register in App Store Connect.
  appId: "com.campusclimb.app",
  appName: "Campus Climb",

  // ─── Web Build Output ────────────────────────────────────────────────────
  // Capacitor copies the Vite build output from this directory into the
  // native iOS project. Run `pnpm run build` before `npx cap sync`.
  webDir: "dist",

  // ─── Server (Development Only) ───────────────────────────────────────────
  // Uncomment the block below ONLY during local development to enable
  // live-reload from your dev server. NEVER ship with this enabled.
  //
  // server: {
  //   url: "http://YOUR_LOCAL_IP:5173",
  //   cleartext: true,
  // },

  // ─── iOS-Specific Configuration ──────────────────────────────────────────
  ios: {
    // Minimum iOS version — iOS 16 covers 95%+ of active devices.
    minVersion: "16.0",

    // Allows the app to use the full screen on notched iPhones.
    contentInset: "automatic",

    // Scroll behavior — matches native iOS feel.
    scrollEnabled: true,

    // Allows the WKWebView to access the local filesystem for PDF export.
    allowsLinkPreview: false,

    // Background color shown during splash screen and transitions.
    backgroundColor: "#ffffff",
  },

  // ─── Plugins ─────────────────────────────────────────────────────────────
  plugins: {
    // SplashScreen: shown while the web app loads on device.
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#4f46e5",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    // StatusBar: style the iOS status bar to match the app.
    StatusBar: {
      style: "Light",
      backgroundColor: "#4f46e5",
    },

    // Keyboard: prevent the keyboard from pushing the layout up awkwardly.
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
