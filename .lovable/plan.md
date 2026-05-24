## Goal
Convert your current web app into a true native mobile app using **Capacitor**, so you can submit it to the Apple App Store and Google Play Store.

## What I'll do in the project
1. Install Capacitor dependencies:
   - `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
2. Create `capacitor.config.ts` with:
   - appId: `app.lovable.0e6ab7db513a44409c73939edff2e3f2`
   - appName: `najoominvoice`
   - A hot-reload `server.url` pointing at your Lovable sandbox so you can test on a real device while developing.
3. Make sure camera/photo capture works natively (your invoice OCR flow) — install `@capacitor/camera` if needed.

## What YOU need to do (must be done on your own computer — cannot be done inside Lovable)
Publishing to the stores requires a Mac (for iOS) and/or a Windows/Mac/Linux machine with Android Studio. After I finish the setup:

1. Click **GitHub → Connect to GitHub** in Lovable and push the project to your own repo.
2. `git clone` the repo to your computer.
3. `npm install`
4. `npx cap add ios` and/or `npx cap add android`
5. `npm run build`
6. `npx cap sync`
7. Run on device/emulator:
   - Android: `npx cap run android` (requires Android Studio)
   - iOS: `npx cap run ios` (requires a Mac with Xcode)

## To actually publish
- **Google Play**: ~$25 one-time developer account. Build a signed AAB in Android Studio → upload via Play Console.
- **Apple App Store**: $99/year Apple Developer account. Archive in Xcode → upload via App Store Connect → submit for review.

## Important notes
- Lovable can only do the **Capacitor setup**. The actual store submission (signing, screenshots, store listings, review) must be done by you outside Lovable.
- The hot-reload `server.url` is great for development but **must be removed before submitting** to the stores — otherwise the published app will load from the Lovable preview instead of your bundled code.
- Reference: https://lovable.dev/blogs/TODO

Want me to proceed with the Capacitor setup?