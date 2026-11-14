import '../setup';

// Never use an inherited application DATABASE_URL for integration tests.
const testUrl = process.env['TEST_DATABASE_URL'];
if (!testUrl) throw new Error('TEST_DATABASE_URL is required for disposable database tests.');
const parsed = new URL(testUrl);
if (!['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) ||
    !/^\/healthcare_[a-z0-9_]+_test$/.test(parsed.pathname)) {
  throw new Error('Integration tests require localhost and a healthcare_*_test database.');
}
process.env['DATABASE_URL'] = testUrl;
process.env['REDIS_URL'] = '';
