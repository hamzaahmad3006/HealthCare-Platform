import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Text, AppState } from 'react-native';
import { StaffAccessProvider } from '../src/screens/staff/Onboarding/StaffAccess';
import { StaffWorkGate } from '../src/screens/staff/Onboarding/StaffWorkGate';
import { CompleteProfile } from '../src/screens/staff/Onboarding/CompleteProfile';
import { StaffDocuments } from '../src/screens/staff/Onboarding/StaffDocuments';
import authReducer from '../src/store/slices/authSlice';
import { api } from '../src/api/client';
import { pick } from '@react-native-documents/picker';
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest'),
);
jest.mock('../src/api/client', () => ({
  api: { get: jest.fn(), patch: jest.fn(), post: jest.fn() },
  STORAGE_KEYS: {},
  extractApiError: (err: Error) => err.message,
}));
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  types: { pdf: 'application/pdf', images: 'image/*' },
  isErrorWithCode: (err: { code?: string }) => Boolean(err.code),
  errorCodes: { OPERATION_CANCELED: 'cancelled' },
}));
jest.mock('../src/utils/deviceId', () => ({
  getDeviceId: async () => 'test-device',
}));
const mockNavigation = { navigate: jest.fn(), replace: jest.fn() };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: (callback: () => void) =>
    require('react').useEffect(callback, [callback]),
}));
let tree: TestRenderer.ReactTestRenderer;
const text = (node: TestRenderer.ReactTestInstance): string =>
  node.children.map(c => (typeof c === 'string' ? c : text(c))).join('');
const press = (label: string) =>
  tree.root
    .findAll(
      n =>
        n.props.accessibilityRole === 'button' &&
        typeof n.props.onPress === 'function',
    )
    .find(n => text(n).includes(label))!
    .props.onPress();
const profile = {
  userId: 'staff',
  staffCode: 'TEST',
  verificationStatus: 'PENDING',
  profileCompletedAt: null as string | null,
  cityId: 'city',
  zoneId: null,
  cnic: '00000-0000000-0',
  gender: null,
  dateOfBirth: null,
  experienceYears: 2,
  ambulanceNumber: null,
  serviceTypes: [
    { serviceType: { id: 'service', code: 'NURSING', name: 'Nursing' } },
  ],
};
async function render(content: React.ReactNode) {
  const initial = authReducer(undefined, { type: 'init' });
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        ...initial,
        user: {
          id: 'staff',
          role: 'STAFF' as const,
          fullName: 'Test Staff',
          phone: '+923000000000',
          email: null,
          avatarUrl: null,
        },
      },
    },
  });
  await act(async () => {
    tree = TestRenderer.create(
      <Provider store={store}>
        <StaffAccessProvider>{content}</StaffAccessProvider>
      </Provider>,
    );
  });
}
beforeEach(() => {
  jest.resetAllMocks();
  jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() });
  profile.verificationStatus = 'PENDING';
  profile.profileCompletedAt = null;
  jest
    .mocked(api.get)
    .mockImplementation(async url => ({
      data: {
        data:
          url === '/staff/me'
            ? { ...profile }
            : url === '/cities'
            ? [{ id: 'city', name: 'Test City', zones: [] }]
            : url === '/service-types'
            ? [{ id: 'service', code: 'NURSING', name: 'Nursing' }]
            : [],
      },
    }));
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.restoreAllMocks();
});

it('blocks work until verified, displays rejected corrections and refreshes to unlock work', async () => {
  await render(
    <StaffWorkGate>
      <Text>Assigned work screen</Text>
    </StaffWorkGate>,
  );
  expect(text(tree.root)).toContain('Complete your profile');
  expect(text(tree.root)).not.toContain('Assigned work screen');
  await act(async () => press('Complete profile'));
  expect(mockNavigation.navigate).toHaveBeenCalledWith('CompleteProfile');
  profile.verificationStatus = 'REJECTED';
  profile.profileCompletedAt = '2030-01-01';
  await act(async () => press('Refresh verification status'));
  expect(text(tree.root)).toContain('verification was rejected');
  profile.verificationStatus = 'VERIFIED';
  await act(async () => press('Refresh verification status'));
  expect(text(tree.root)).toContain('Assigned work screen');
});
it('fails closed on profile-read errors and offers retry and logout', async () => {
  jest.mocked(api.get).mockRejectedValue(new Error('Offline'));
  await render(
    <StaffWorkGate>
      <Text>Assigned work screen</Text>
    </StaffWorkGate>,
  );
  expect(text(tree.root)).toContain('Offline');
  expect(text(tree.root)).toContain('Logout');
  expect(text(tree.root)).not.toContain('Assigned work screen');
  jest.mocked(api.get).mockResolvedValue({ data: { data: profile } });
  await act(async () => press('Refresh verification status'));
  expect(text(tree.root)).toContain('Complete profile');
});
it('refreshes verification on app resume and removes work after revocation', async () => {
  profile.verificationStatus = 'VERIFIED';
  profile.profileCompletedAt = '2030-01-01';
  await render(
    <StaffWorkGate>
      <Text>Assigned work screen</Text>
    </StaffWorkGate>,
  );
  expect(text(tree.root)).toContain('Assigned work screen');
  profile.verificationStatus = 'REJECTED';
  const callback = jest.mocked(AppState.addEventListener).mock.calls[0][1];
  await act(async () => callback('active'));
  expect(text(tree.root)).not.toContain('Assigned work screen');
  expect(text(tree.root)).toContain('verification was rejected');
});
it('retains editable profile values after save failure and opens documents after success', async () => {
  await render(<CompleteProfile />);
  jest.mocked(api.patch).mockRejectedValueOnce(new Error('Save unavailable'));
  await act(async () => press('Save profile and continue'));
  expect(text(tree.root)).toContain('Save unavailable');
  jest.mocked(api.patch).mockResolvedValueOnce({ data: { data: {} } });
  await act(async () => press('Save profile and continue'));
  expect(api.patch).toHaveBeenLastCalledWith('/staff/me/profile', {
    cityId: 'city',
    cnic: '00000-0000000-0',
    experienceYears: 2,
    serviceTypeIds: ['service'],
  });
  expect(mockNavigation.replace).toHaveBeenCalledWith('StaffDocuments');
});
it('shows document status and keeps provider failures retryable without confirming an upload', async () => {
  jest
    .mocked(api.get)
    .mockImplementation(async url => ({
      data: {
        data:
          url === '/staff/me'
            ? profile
            : [
                {
                  id: 'doc',
                  documentType: 'CNIC',
                  verificationStatus: 'REJECTED',
                  uploadedAt: '2030-01-01',
                },
              ],
      },
    }));
  await render(<StaffDocuments />);
  expect(text(tree.root)).toContain('REJECTED');
  expect(text(tree.root)).toContain('corrected replacement');
  jest
    .mocked(pick)
    .mockResolvedValue([
      {
        uri: 'file:///test/document.pdf',
        name: 'document.pdf',
        type: 'application/pdf',
        size: 20,
        error: null,
        nativeType: 'application/pdf',
        isVirtual: false,
        convertibleToMimeTypes: null,
        hasRequestedType: true,
      },
    ] as Awaited<ReturnType<typeof pick>>);
  jest
    .mocked(api.post)
    .mockResolvedValue({
      data: {
        data: {
          uploadUrl: 'https://example.invalid/upload',
          fileKey: 'staff/staff/CNIC/file',
          uploadParams: {
            public_id: 'staff/staff/CNIC/file',
            api_key: 'test-only',
            signature: 'test-only',
            timestamp: 1,
          },
        },
      },
    });
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false } as Response);
  await act(async () => press('Upload CNIC'));
  expect(text(tree.root)).toContain('Document upload failed');
  expect(api.post).toHaveBeenCalledTimes(1);
  jest
    .mocked(globalThis.fetch)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secure_url: 'https://example.invalid/document',
        public_id: 'staff/staff/CNIC/file',
      }),
    } as Response);
  await act(async () => press('Upload CNIC'));
  expect(text(tree.root)).toContain('Document submitted for admin review');
  expect(api.post).toHaveBeenLastCalledWith(
    '/staff/staff/documents/confirm',
    expect.objectContaining({ documentType: 'CNIC' }),
  );
});
it('treats picker cancellation as a normal action', async () => {
  await render(<StaffDocuments />);
  jest.mocked(pick).mockRejectedValueOnce({ code: 'cancelled' });
  await act(async () => press('Upload CNIC'));
  expect(api.post).not.toHaveBeenCalled();
  expect(text(tree.root)).not.toContain('failed');
});
