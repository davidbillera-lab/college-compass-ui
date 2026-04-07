# Campus Climb — iOS App Setup Guide

This guide walks you through packaging the Campus Climb web app as a native iOS app using Capacitor and submitting it to the App Store with your Apple Developer account.

---

## Prerequisites

Before you begin, ensure you have the following installed on your **Mac**:

| Tool | Version | Install |
|------|---------|---------|
| Xcode | 15+ | Mac App Store |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| pnpm | Latest | `npm i -g pnpm` |
| CocoaPods | Latest | `sudo gem install cocoapods` |

You will also need:
- An **Apple Developer Account** ($99/year — already confirmed)
- Your **Bundle ID** registered in [App Store Connect](https://appstoreconnect.apple.com) (e.g., `com.campusclimb.app`)

---

## Step 1: Clone the Repo and Install Dependencies

```bash
git clone https://github.com/davidbillera-lab/college-compass-ui.git
cd college-compass-ui
pnpm install
```

---

## Step 2: Build the Web App

Capacitor wraps the production build of your web app. Always build before syncing.

```bash
pnpm run build
```

This generates the `dist/` folder that Capacitor copies into the iOS project.

---

## Step 3: Add the iOS Platform

Run this **once** to scaffold the native iOS Xcode project:

```bash
npx cap add ios
```

This creates an `ios/` directory containing a full Xcode project.

---

## Step 4: Sync Web Build to iOS

Every time you make changes to the web app and rebuild, run:

```bash
pnpm run build && npx cap sync ios
```

This copies the latest `dist/` build and any plugin updates into the Xcode project.

---

## Step 5: Open in Xcode

```bash
npx cap open ios
```

This opens the `ios/App/App.xcworkspace` file in Xcode.

---

## Step 6: Configure Signing in Xcode

1. In Xcode, select the **App** target in the Project Navigator.
2. Click the **Signing & Capabilities** tab.
3. Check **Automatically manage signing**.
4. Select your **Apple Developer Team** from the dropdown.
5. Set the **Bundle Identifier** to `com.campusclimb.app` (or your registered ID).

---

## Step 7: Update App Identity

In `capacitor.config.ts`, confirm these values match your App Store Connect registration:

```typescript
appId: "com.campusclimb.app",   // Must match your Bundle ID exactly
appName: "Campus Climb",
```

---

## Step 8: Add App Icons and Splash Screen

Capacitor requires icons in specific sizes. Use a tool like [capacitor-assets](https://github.com/ionic-team/capacitor-assets) to auto-generate them:

```bash
pnpm add -D @capacitor/assets
# Place a 1024x1024 PNG at: assets/icon.png
# Place a 2732x2732 PNG at: assets/splash.png
npx capacitor-assets generate
```

---

## Step 9: Test on a Device or Simulator

In Xcode:
1. Select your target device (physical iPhone or simulator) from the toolbar.
2. Press **⌘R** (or the Play button) to build and run.

For a physical device, ensure it is trusted and connected via USB.

---

## Step 10: Archive and Submit to App Store

1. In Xcode, select **Product → Archive**.
2. Once the archive is created, the **Organizer** window opens automatically.
3. Click **Distribute App → App Store Connect → Upload**.
4. Follow the prompts to submit for TestFlight or direct App Store review.

---

## Workflow: Making Updates

After every code change:

```bash
# 1. Make your changes to the React app
# 2. Build the web app
pnpm run build

# 3. Sync to iOS
npx cap sync ios

# 4. Open Xcode and archive/submit
npx cap open ios
```

---

## Supabase Edge Functions

The new AI features use Supabase Edge Functions. After deploying to production:

```bash
# Deploy all edge functions
supabase functions deploy financial-aid-assistant
supabase functions deploy appeal-letter-generator
supabase functions deploy career-assessment

# Set the Anthropic API key secret
supabase secrets set ANTHROPIC_API_KEY=your_key_here
```

---

## New Database Tables

Run the migration to create the new tables:

```bash
supabase db push
# or apply the migration manually in the Supabase dashboard
# File: supabase/migrations/20260407000000_new_features.sql
```

---

## App Store Listing Recommendations

| Field | Suggested Value |
|-------|----------------|
| **App Name** | Campus Climb — College Planning |
| **Subtitle** | Your Personal College Consultant |
| **Category** | Education |
| **Secondary Category** | Productivity |
| **Age Rating** | 4+ |
| **Price** | Free (with $199 setup + $19.99/mo IAP) |

**Keywords to target:** college planning, scholarship finder, FAFSA help, college application, financial aid, essay coach, college list

---

## In-App Purchase Setup

For the $199 setup fee and $19.99/month subscription, configure in App Store Connect:

1. Go to **App Store Connect → Your App → In-App Purchases**.
2. Create a **Non-Consumable** product for the $199 one-time setup fee.
3. Create an **Auto-Renewable Subscription** for $19.99/month.
4. Integrate with your existing Supabase subscription logic.

> **Note:** Apple takes a 30% commission on in-app purchases (15% for subscriptions after year 1). Factor this into your pricing strategy.

---

## Support

For Capacitor documentation: [capacitorjs.com/docs](https://capacitorjs.com/docs)  
For App Store submission guidelines: [developer.apple.com/app-store](https://developer.apple.com/app-store/review/guidelines/)
