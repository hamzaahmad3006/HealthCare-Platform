import { redact } from '../../src/helper/redact.helper';

describe('audit log redaction', () => {
  it('masks top-level password field', () => {
    expect(redact({ email: 'a@b.com', password: 'secret' })).toEqual({
      email: 'a@b.com',
      password: '[REDACTED]',
    });
  });

  it('masks every known sensitive key', () => {
    const result = redact({
      password: 'x',
      newPassword: 'x',
      currentPassword: 'x',
      token: 'x',
      refreshToken: 'x',
      accessToken: 'x',
      otp: '123456',
      pin: '4242',
      cvv: '111',
      cardNumber: '4242424242424242',
    });
    for (const value of Object.values(result as Record<string, unknown>)) {
      expect(value).toBe('[REDACTED]');
    }
  });

  it('recurses into nested objects', () => {
    const result = redact({
      user: {
        email: 'a@b.com',
        credentials: { password: 'secret', otp: '1234' },
      },
    }) as { user: { email: string; credentials: Record<string, string> } };

    expect(result.user.email).toBe('a@b.com');
    expect(result.user.credentials['password']).toBe('[REDACTED]');
    expect(result.user.credentials['otp']).toBe('[REDACTED]');
  });

  it('recurses into arrays', () => {
    const result = redact([{ password: 'a' }, { password: 'b' }]) as Array<Record<string, string>>;
    expect(result[0]?.['password']).toBe('[REDACTED]');
    expect(result[1]?.['password']).toBe('[REDACTED]');
  });

  it('passes non-sensitive primitive values through unchanged', () => {
    expect(redact('hello')).toBe('hello');
    expect(redact(42)).toBe(42);
    expect(redact(true)).toBe(true);
  });

  it('treats null and undefined as empty object', () => {
    expect(redact(null)).toEqual({});
    expect(redact(undefined)).toEqual({});
  });
});
