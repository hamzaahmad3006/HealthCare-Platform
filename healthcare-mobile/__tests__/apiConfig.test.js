import { mkdtempSync, readFileSync, rmSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolveApiBase } from '../src/api/config';
const { readApiConfig, generateApiConfig } = require('../scripts/configure-api');

it('uses deterministic Android emulator and iOS simulator development defaults', () => {
  const config = { ...readApiConfig({}), productionUrl: null };
  expect(resolveApiBase(config, true, 'android')).toBe('http://10.0.2.2:3000/api/v1');
  expect(resolveApiBase(config, true, 'ios')).toBe('http://localhost:3000/api/v1');
});

it('uses an explicit development API URL for devices without scanning network interfaces', () => {
  const config = { ...readApiConfig({ MOBILE_DEV_API_URL: 'http://192.168.1.10:3000/api/v1/' }), productionUrl: null };
  expect(resolveApiBase(config, true, 'android')).toBe('http://192.168.1.10:3000/api/v1');
  expect(resolveApiBase(config, true, 'ios')).toBe('http://192.168.1.10:3000/api/v1');
});

it('requires production configuration at generation and at runtime', () => {
  expect(() => readApiConfig({}, true)).toThrow('MOBILE_API_URL is required for production');
  expect(() => resolveApiBase({ ...readApiConfig({}), productionUrl: null }, false, 'android')).toThrow('MOBILE_API_URL is required for production');
});

it('uses only the explicitly supplied production API URL', () => {
  // Reserved test domain: this fixture never configures an app build.
  const config = readApiConfig({ MOBILE_API_URL: 'https://healthcare.example.test/api/v1/' }, true);
  expect(resolveApiBase(config, false, 'android')).toBe('https://healthcare.example.test/api/v1');
  expect(resolveApiBase(config, false, 'ios')).toBe('https://healthcare.example.test/api/v1');
});

it.each(['not-a-url', 'file:///tmp/api', 'http://api.example.test', 'https://user:secret@api.example.test', 'https://api.example.test?token=secret', 'https://api.example.test#fragment'])('rejects invalid/unsafe production configuration without echoing values: %s', value => {
  expect(() => readApiConfig({ MOBILE_API_URL: value }, true)).toThrow(/MOBILE_API_URL must/);
  try { readApiConfig({ MOBILE_API_URL: value }, true); } catch (error) {
    expect(error.message).not.toContain('secret');
  }
});

it.each(['bad', 'ftp://localhost', 'http://user:password@localhost:3000'])('rejects invalid development configuration: %s', value => {
  expect(() => readApiConfig({ MOBILE_DEV_API_URL: value })).toThrow(/MOBILE_DEV_API_URL must/);
});

it('generates missing parent directories and is repeatable without rewriting unchanged configuration', () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'mobile-api-config-'));
  const output = path.join(folder, 'src/api/host.ts');
  try {
    expect(existsSync(output)).toBe(false);
    generateApiConfig({ env: {}, output });
    const content = readFileSync(output, 'utf8');
    const before = statSync(output).mtimeMs;
    generateApiConfig({ env: {}, output });
    expect(readFileSync(output, 'utf8')).toBe(content);
    expect(statSync(output).mtimeMs).toBe(before);
    expect(content).toContain('"productionUrl": null');
    expect(content).not.toContain('yourdomain');
    expect(() => generateApiConfig({ env: {}, output, production: true })).toThrow('MOBILE_API_URL is required');
    expect(readFileSync(output, 'utf8')).toBe(content);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});

it('rejects release Babel transforms when production configuration is absent', () => {
  const { transformSync } = require('@babel/core');
  const previous = process.env.MOBILE_API_URL;
  delete process.env.MOBILE_API_URL;
  try {
    expect(() => transformSync('const value = 1;', {
      configFile: path.join(__dirname, '../babel.config.js'), envName: 'production',
    })).toThrow('MOBILE_API_URL is required for production');
  } finally {
    if (previous === undefined) delete process.env.MOBILE_API_URL;
    else process.env.MOBILE_API_URL = previous;
  }
});
