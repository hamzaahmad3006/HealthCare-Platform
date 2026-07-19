import { initializeApp, cert, type App } from 'firebase-admin/app';
import { env } from './env';

// When the three FIREBASE_* vars are set, initializes and exports the
// firebase-admin app singleton used by FirebaseNotificationService. When any is
// missing, `pushEnabled` is false and no app is initialized — push dispatch
// no-ops (WhatsApp delivery is unaffected). Mirrors the REDIS_URL / BREVO_API_KEY
// soft-fail pattern so dev/CI can run without Firebase credentials.

export const pushEnabled = Boolean(
  env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY,
);

function createApp(): App | null {
  if (!pushEnabled) {
    console.warn('⚠️  FIREBASE_* not fully set — push notifications disabled');
    return null;
  }

  const app = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // .env stores the PEM with literal "\n"; the SDK needs real newlines.
      privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });

  console.log('✅ Firebase Admin initialized');
  return app;
}

export const firebaseApp = createApp();
