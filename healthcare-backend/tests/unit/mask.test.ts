import { maskCnic, maskPhone } from '../../src/helper/mask.helper';

describe('maskCnic', () => {
  it('returns null for null or undefined', () => {
    expect(maskCnic(null)).toBeNull();
    expect(maskCnic(undefined)).toBeNull();
  });

  it('keeps the last 4 digits visible and masks the rest', () => {
    // CNIC cleaned: "3520112345671" (13 digits) -> last 4 = "5671"
    expect(maskCnic('35201-1234567-1')).toBe('*********5671');
    expect(maskCnic('1234567890123')).toBe('*********0123');
  });

  it('returns **** for inputs with 4 or fewer digits', () => {
    expect(maskCnic('123')).toBe('****');
    expect(maskCnic('1234')).toBe('****');
  });

  it('strips non-digit characters before masking', () => {
    expect(maskCnic('AB-12345-678')).toMatch(/^\*+5678$/);
  });
});

describe('maskPhone', () => {
  it('returns null for null or undefined', () => {
    expect(maskPhone(null)).toBeNull();
    expect(maskPhone(undefined)).toBeNull();
  });

  it('keeps first 3 and last 3 digits visible', () => {
    expect(maskPhone('+923001234567')).toBe('+92*******567');
  });

  it('returns **** for very short inputs', () => {
    expect(maskPhone('123')).toBe('****');
    expect(maskPhone('1234')).toBe('****');
  });
});
