# HomeHealth mobile

React Native 0.85 / React 19 customer and staff app. Run commands below from
`healthcare-mobile/` in the existing checkout.

## Fresh checkout

Use Node **22.11 or newer** and npm (the repository includes `package-lock.json`).

```sh
npm ci
npm run typecheck
npm test -- --ci --runInBand
npm start
```

`npm ci` generates the ignored `src/api/host.ts` using the postinstall script.
Typechecking, Metro, Android and iOS also regenerate it, so a missing generated
file does not require building Android first. `npm run config:dev` refreshes it
explicitly. Generation is deterministic and does not scan network interfaces.
Do not commit generated configuration or edit it by hand.

The CI mobile job runs a frozen install, configuration generation, TypeScript
and Jest on Node 22. It does not build or test a native application.

## Development API

The backend uses `/api/v1` on port 3000. Defaults are:

- Android emulator: `http://10.0.2.2:3000/api/v1` (emulator alias for the host).
- iOS simulator: `http://localhost:3000/api/v1`.

For a physical device or remote backend, set **MOBILE_DEV_API_URL** to the full
reachable API base URL, including `/api/v1`, in the shell running Metro and the
build. For example, with a backend on your local network:

```sh
MOBILE_DEV_API_URL=http://192.168.1.10:3000/api/v1 npm start -- --reset-cache
```

Use your backend machine's actual address. A physical device's `localhost` is
the device itself. After changing environment variables, restart Metro with
`--reset-cache`; a previously bundled app keeps the old configuration.
Environment variables come from the process/build environment; `.env` files
are not loaded automatically. URLs cannot contain embedded credentials, query
parameters or fragments. Do not put tokens in these values.

## Production API

Set **MOBILE_API_URL** in the release build environment to your real deployed
**HTTPS API base URL**, including the API path. There is deliberately no
production default. This repository does not supply a production hostname.

```sh
# MOBILE_API_URL must already be exported by your shell or build system.
npm run config:production
```

Metro/Babel generate configuration for direct native/IDE builds too. Release
Babel transforms fail when `MOBILE_API_URL` is missing or invalid; runtime
configuration also guards against a missing production URL. Production never
falls back to an emulator/development address. Keep the variable exported for
the entire release build; generation alone does not export it to later commands.

## Native development and verification

Android requires **JDK 17**, Android SDK **36**, Build Tools **36.0.0**, NDK
**27.1.12297006**, and a device/emulator. Set `JAVA_HOME` and `ANDROID_HOME`
(or use an ignored `android/local.properties` for the SDK). Firebase's native
configuration must match your application; supply it through your normal local
or secure build configuration, without committing credentials.

```sh
npm run android
# Build a debug APK without requiring an attached device:
cd android
./gradlew :app:assembleDebug --no-daemon --max-workers=2
```

On macOS, install Xcode and CocoaPods, run `bundle install` followed by
`cd ios && bundle exec pod install`, then `npm run ios` from the mobile root.
Simulator and physical-device verification are separate from TypeScript/Jest.

To check JavaScript and asset bundling without an Android SDK:

```sh
npx react-native bundle --platform android --dev true --entry-file index.js \
  --bundle-output /tmp/homehealth-mobile/index.android.bundle \
  --assets-dest /tmp/homehealth-mobile/assets --max-workers 2
```

Jest uses native-service mocks for storage, document picking, location, safe
area and push messaging. Its App test renders the real providers/navigators;
these mocks do not establish that native services work on a device. Verify
customer/staff navigation, API connectivity, uploads, location and push on the
target devices before a release.

## Doctor bookings

For a Visiting Doctor package, select the patient and service address first.
The optional doctor picker then lists available, verified doctors in that city.
Skipping the picker retains the existing admin-assignment flow. Selecting a
doctor creates `PENDING_DOCTOR`; a verified visiting doctor can open **Doctor
requests** from the staff Home screen and accept or propose a future local time.

A proposal becomes `TIME_PROPOSED`. The owning customer can accept it in booking
detail, moving the booking to `PENDING` for admin confirmation, or decline and
cancel it. Doctor acceptance also goes to `PENDING`, not directly to confirmed.
The backend enforces eligibility, ownership and state transitions independently
of these screens. Accepted proposals replace only an unstarted, undocumented
schedule; clinical records cannot be overwritten by doctor replies.

On a device, verify selection, doctor acceptance, proposal acceptance/decline,
repeated taps, expired proposals, retry after network failure and both foreground
and cold-start notification taps. Doctor notifications open Doctor Requests;
customer notifications open booking detail and refetch its state. Pull to refresh
or revisit bookings to pick up changes from another device. Native push delivery
requires your configured Firebase credentials and a running backend.

## Password recovery and staff verification

Use **Forgot password?** on Login to request the existing 15-minute reset code.
The app always shows a generic delivery message. Reset accepts the newest
6-digit code, a new password and its confirmation, then stores the returned
session exactly like login. Admin accounts continue to use the web panel.
Passwords and codes stay in form memory; they are not placed in navigation
parameters or persistent storage.

Invited staff can complete their profile, select city/zone and services, and
upload PDF/JPEG/PNG verification documents up to 10 MB. Ambulance service
requires a registration number. Pending or rejected staff see verification
status, correction/upload actions, refresh, notifications and logout. Work
screens require a completed, verified profile fetched from the server; status
refreshes on app resume and work-screen focus. Backend work mutations enforce
verification independently of the app.

Profile corrections return changed verification details to pending review.
Rejected staff can submit replacement documents; previous evidence remains in
the admin audit trail. Documents and overall staff verification are separate
admin decisions. Uploading documents does not automatically verify staff.

Before release, verify real reset delivery, code expiry, token refresh/logout
after recovery, Android/iOS document-picker permissions and uploads, admin
review/resubmission, notification navigation, app resume and verification
revocation on devices. Automated tests mock message delivery, storage-provider
requests and native services; they never send real reset messages.
