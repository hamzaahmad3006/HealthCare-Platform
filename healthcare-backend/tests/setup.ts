// Provide deterministic fake env values for unit tests that import config/env.ts.
// Real integration tests should load a separate .env.test file.
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3000';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test';
// REDIS_URL intentionally omitted — tests exercise the in-memory cache shim.
process.env['JWT_PRIVATE_KEY'] = 'test-private-key';
process.env['JWT_PUBLIC_KEY'] = 'test-public-key';
process.env['JWT_ACCESS_TTL'] = '15m';
process.env['JWT_REFRESH_TTL'] = '7d';
process.env['CLOUDINARY_CLOUD_NAME'] = 'test-cloud';
process.env['CLOUDINARY_API_KEY'] = 'test-api-key';
process.env['CLOUDINARY_API_SECRET'] = 'test-api-secret';
process.env['WHATSAPP_API_URL'] = 'https://example.com';
process.env['WHATSAPP_API_TOKEN'] = 'test-token';
process.env['WHATSAPP_PHONE_NUMBER_ID'] = 'test-phone-id';
process.env['STRIPE_SECRET_KEY'] = 'sk_test_dummy';
process.env['STRIPE_WEBHOOK_SECRET'] = 'whsec_dummy';
process.env['CORS_ORIGINS'] = 'http://localhost:5173';
