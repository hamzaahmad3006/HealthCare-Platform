// Provide deterministic fake env values for unit tests that import config/env.ts.
// Real integration tests should load a separate .env.test file.
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3000';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['JWT_PRIVATE_KEY'] = 'test-private-key';
process.env['JWT_PUBLIC_KEY'] = 'test-public-key';
process.env['JWT_ACCESS_TTL'] = '15m';
process.env['JWT_REFRESH_TTL'] = '7d';
process.env['AWS_ACCESS_KEY_ID'] = 'test';
process.env['AWS_SECRET_ACCESS_KEY'] = 'test';
process.env['AWS_BUCKET_NAME'] = 'test-bucket';
process.env['AWS_REGION'] = 'us-east-1';
process.env['S3_PRESIGN_TTL'] = '300';
process.env['WHATSAPP_API_URL'] = 'https://example.com';
process.env['WHATSAPP_API_TOKEN'] = 'test-token';
process.env['WHATSAPP_PHONE_NUMBER_ID'] = 'test-phone-id';
process.env['STRIPE_SECRET_KEY'] = 'sk_test_dummy';
process.env['STRIPE_WEBHOOK_SECRET'] = 'whsec_dummy';
process.env['CORS_ORIGINS'] = 'http://localhost:5173';
