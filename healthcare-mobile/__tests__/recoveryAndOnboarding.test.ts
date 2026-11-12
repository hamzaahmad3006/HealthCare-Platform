import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer, {
  resetPassword,
  ADMIN_BLOCKED_MESSAGE,
} from '../src/store/slices/authSlice';
import { api, STORAGE_KEYS } from '../src/api/client';
import { recoveryPhone, resetPayload } from '../src/utils/recovery';
import {
  staffCanWork,
  staffProfilePayload,
  validateVerificationFile,
} from '../src/utils/staffOnboarding';
import { uploadStaffDocument } from '../src/api/staffDocuments';
import type {
  StaffProfileDraft,
  VerificationFile,
} from '../src/types/staffOnboarding.types';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest'),
);
jest.mock('../src/api/client', () => ({
  api: { post: jest.fn() },
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'access',
    REFRESH_TOKEN: 'refresh',
    USER: 'user',
  },
  extractApiError: (err: Error) => err.message,
}));
jest.mock('../src/utils/deviceId', () => ({
  getDeviceId: async () => 'test-device',
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AsyncStorage, 'setMany');
});
afterEach(() => {
  jest.restoreAllMocks();
});

it.each(['03000000000', '3000000000', '+923000000000', '92 300 0000000'])(
  'normalizes recovery phone %s',
  phone => {
    expect(recoveryPhone(phone)).toBe('+923000000000');
  },
);
it.each(['123', 'abc3000000000', '+913000000000'])(
  'rejects invalid recovery phone %s',
  phone => {
    expect(() => recoveryPhone(phone)).toThrow('valid Pakistani mobile');
  },
);
it('validates codes/passwords and sends the existing reset contract', () => {
  const password = 'test-only-password';
  expect(resetPayload('03000000000', '000000', password, password)).toEqual({
    phone: '+923000000000',
    otp: '000000',
    newPassword: password,
  });
  expect(() =>
    resetPayload('03000000000', 'abcdef', password, password),
  ).toThrow('6-digit');
  expect(() => resetPayload('03000000000', '000000', 'short', 'short')).toThrow(
    '8 characters',
  );
  expect(() =>
    resetPayload('03000000000', '000000', password, 'different'),
  ).toThrow('do not match');
});
it.each(['CUSTOMER', 'STAFF'])(
  'persists the reset token pair and %s role exactly like login',
  async role => {
    const user = {
      id: 'test-user',
      role,
      staffVerificationStatus: role === 'STAFF' ? 'PENDING' : null,
    };
    jest
      .mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          data: {
            user,
            accessToken: 'test-access',
            refreshToken: 'test-refresh',
          },
        },
      });
    const store = configureStore({ reducer: { auth: authReducer } });
    await store.dispatch(
      resetPassword({
        phone: '+923000000000',
        otp: '000000',
        newPassword: 'test-only-password',
      }),
    );
    expect(AsyncStorage.setMany).toHaveBeenCalledWith({
      [STORAGE_KEYS.USER]: JSON.stringify(user),
      [STORAGE_KEYS.ACCESS_TOKEN]: 'test-access',
      [STORAGE_KEYS.REFRESH_TOKEN]: 'test-refresh',
    });
    expect(store.getState().auth.user?.role).toBe(role);
  },
);
it('retains the mobile admin restriction during recovery', async () => {
  jest
    .mocked(api.post)
    .mockResolvedValueOnce({
      data: {
        data: {
          user: { role: 'ADMIN' },
          accessToken: 'test-access',
          refreshToken: 'test-refresh',
        },
      },
    });
  const store = configureStore({ reducer: { auth: authReducer } });
  await store.dispatch(
    resetPassword({
      phone: '+923000000000',
      otp: '000000',
      newPassword: 'test-only-password',
    }),
  );
  expect(store.getState().auth.user).toBeNull();
  expect(store.getState().auth.error).toBe(ADMIN_BLOCKED_MESSAGE);
  expect(AsyncStorage.setMany).not.toHaveBeenCalled();
});
it('does not store tokens after an invalid/expired code response', async () => {
  jest
    .mocked(api.post)
    .mockRejectedValueOnce(new Error('Invalid or expired reset code'));
  const store = configureStore({ reducer: { auth: authReducer } });
  await store.dispatch(
    resetPassword({
      phone: '+923000000000',
      otp: '000000',
      newPassword: 'test-only-password',
    }),
  );
  expect(store.getState().auth.error).toBe('Invalid or expired reset code');
  expect(AsyncStorage.setMany).not.toHaveBeenCalled();
});

const draft: StaffProfileDraft = {
  cityId: 'city',
  zoneId: '',
  cnic: '00000-0000000-0',
  gender: '',
  dateOfBirth: '',
  experienceYears: '2',
  ambulanceNumber: '',
  serviceTypeIds: ['service'],
};
const services = [{ id: 'service', name: 'Nursing', code: 'NURSING' }];
const cities = [{ id: 'city', name: 'City', zones: [] }];
it('sends self-completion fields without user IDs or verification overrides', () => {
  expect(staffProfilePayload(draft, services, cities)).toEqual({
    cityId: 'city',
    cnic: draft.cnic,
    experienceYears: 2,
    serviceTypeIds: ['service'],
  });
});
it.each([
  { cnic: '-------------' },
  { experienceYears: '2.5' },
  { experienceYears: '61' },
  { dateOfBirth: '2020-02-30' },
  { serviceTypeIds: [] },
  { zoneId: 'other' },
])('rejects invalid profile values %p', patch => {
  expect(() =>
    staffProfilePayload({ ...draft, ...patch }, services, cities),
  ).toThrow();
});
it('requires ambulance registration only when offering ambulance service', () => {
  const ambulance = [{ ...services[0], code: 'AMBULANCE' }];
  expect(() => staffProfilePayload(draft, ambulance, cities)).toThrow(
    'registration',
  );
  expect(
    staffProfilePayload(
      { ...draft, ambulanceNumber: 'TEST-123' },
      ambulance,
      cities,
    ),
  ).toHaveProperty('ambulanceNumber', 'TEST-123');
});
it('unlocks work only for VERIFIED and completed profiles', () => {
  for (const verificationStatus of ['PENDING', 'REJECTED', null] as const)
    expect(
      staffCanWork({ verificationStatus, profileCompletedAt: '2030-01-01' }),
    ).toBe(false);
  expect(
    staffCanWork({ verificationStatus: 'VERIFIED', profileCompletedAt: null }),
  ).toBe(false);
  expect(
    staffCanWork({
      verificationStatus: 'VERIFIED',
      profileCompletedAt: '2030-01-01',
    }),
  ).toBe(true);
  expect(staffCanWork(null)).toBe(false);
});

const file: VerificationFile = {
  uri: 'file:///test/document.pdf',
  name: 'document.pdf',
  type: 'application/pdf',
  size: 20,
};
const fileKey = 'staff/test-user/CNIC/test-document';
function mockPresign() {
  jest
    .mocked(api.post)
    .mockResolvedValue({
      data: {
        data: {
          uploadUrl: 'https://example.invalid/upload',
          fileKey,
          uploadParams: {
            public_id: fileKey,
            api_key: 'test-only',
            signature: 'test-only',
            timestamp: 1,
            resource_type: 'raw',
          },
        },
      },
    });
}
it.each([{ type: 'application/exe' }, { size: 0 }, { size: 11 * 1024 * 1024 }])(
  'rejects invalid upload metadata before requesting a signature %p',
  async patch => {
    expect(() => validateVerificationFile({ ...file, ...patch })).toThrow();
    await expect(
      uploadStaffDocument('test-user', 'CNIC', { ...file, ...patch }),
    ).rejects.toThrow();
    expect(api.post).not.toHaveBeenCalled();
  },
);
it('uploads signed multipart data without API auth and confirms only after provider success', async () => {
  mockPresign();
  const send = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue({
      ok: true,
      json: async () => ({
        secure_url: 'https://example.invalid/document',
        public_id: fileKey,
      }),
    } as Response);
  await uploadStaffDocument('test-user', 'CNIC', file);
  expect(send).toHaveBeenCalledWith('https://example.invalid/upload', {
    method: 'POST',
    body: expect.any(FormData),
  });
  expect(api.post).toHaveBeenLastCalledWith(
    '/staff/test-user/documents/confirm',
    {
      documentType: 'CNIC',
      fileKey,
      fileUrl: 'https://example.invalid/document',
      mimeType: file.type,
      fileSizeBytes: file.size,
    },
  );
});
it.each(['presign', 'network', 'provider', 'mismatched-file', 'confirm'])(
  'surfaces %s upload failure without falsely reporting success',
  async failure => {
    mockPresign();
    const send = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({
        ok: failure !== 'provider',
        json: async () => ({
          secure_url: 'https://example.invalid/document',
          public_id: failure === 'mismatched-file' ? 'other' : fileKey,
        }),
      } as Response);
    if (failure === 'presign')
      jest
        .mocked(api.post)
        .mockRejectedValueOnce(new Error('signature unavailable'));
    if (failure === 'network')
      send.mockRejectedValueOnce(new Error('network unavailable'));
    if (failure === 'confirm')
      jest
        .mocked(api.post)
        .mockResolvedValueOnce({
          data: {
            data: {
              uploadUrl: 'https://example.invalid/upload',
              fileKey,
              uploadParams: { public_id: fileKey },
            },
          },
        })
        .mockRejectedValueOnce(new Error('confirm unavailable'));
    await expect(
      uploadStaffDocument('test-user', 'CNIC', file),
    ).rejects.toThrow();
    if (failure !== 'confirm')
      expect(
        jest
          .mocked(api.post)
          .mock.calls.some(([url]) => url.endsWith('/confirm')),
      ).toBe(false);
  },
);
