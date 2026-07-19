import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Optional. When unset, an in-memory cache shim takes over for rate limits,
  // idempotency, login lockout, dashboard cache, and Stripe event dedup; the
  // notification queue runs the WhatsApp send inline; the reminder job runs on
  // a setInterval. Single-process only — set REDIS_URL for any multi-instance
  // deploy.
  REDIS_URL: z.string().optional(),

  JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY is required'),
  JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY is required'),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2592000),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  WHATSAPP_API_URL: z.string().url('WHATSAPP_API_URL must be a valid URL'),
  WHATSAPP_API_TOKEN: z.string().min(1, 'WHATSAPP_API_TOKEN is required'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1, 'WHATSAPP_PHONE_NUMBER_ID is required'),

  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),

  // Optional. When unset, email invitations silently no-op (admin still gets
  // tempPassword in API response to share manually). Brevo free tier:
  // 300/day. Sender email MUST be verified in the Brevo dashboard or sends
  // will return 401/400.
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().default('noreply@homehealth.local'),
  BREVO_SENDER_NAME: z.string().default('HomeHealth'),
  STAFF_LOGIN_URL: z.string().default('http://localhost:5173/login'),

  // Optional (Firebase Cloud Messaging service account). When any of the three
  // is unset, `pushEnabled` is false and push dispatch silently no-ops — WhatsApp
  // delivery is unaffected. Sourced from the service-account JSON downloaded at
  // Firebase console > Project Settings > Service Accounts. FIREBASE_PRIVATE_KEY
  // holds a PEM with literal "\n" escapes (unescaped at init in config/firebase.ts).
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
