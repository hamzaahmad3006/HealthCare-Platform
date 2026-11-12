import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ForgotPassword } from '../src/screens/auth/Recovery/ForgotPassword';
import { ResetPassword } from '../src/screens/auth/Recovery/ResetPassword';
import authReducer from '../src/store/slices/authSlice';
import { api } from '../src/api/client';
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest'),
);
jest.mock('../src/api/client', () => ({
  api: { post: jest.fn() },
  STORAGE_KEYS: {
    USER: 'user',
    ACCESS_TOKEN: 'access',
    REFRESH_TOKEN: 'refresh',
  },
  extractApiError: (err: Error) => err.message,
}));
jest.mock('../src/utils/deviceId', () => ({
  getDeviceId: async () => 'test-device',
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
const fill = (label: string, value: string) =>
  tree.root
    .findAll(
      n =>
        n.props.accessibilityLabel === label &&
        typeof n.props.onChangeText === 'function',
    )[0]
    .props.onChangeText(value);
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.resetAllMocks();
});

it('validates phone input, recovers from delivery errors and opens the OTP screen with the normalized phone', async () => {
  const navigation = { navigate: jest.fn() } as unknown as React.ComponentProps<
    typeof ForgotPassword
  >['navigation'];
  await act(async () => {
    tree = TestRenderer.create(
      <ForgotPassword
        navigation={navigation}
        route={{} as React.ComponentProps<typeof ForgotPassword>['route']}
      />,
    );
  });
  await act(async () => press('Send reset code'));
  expect(text(tree.root)).toContain('valid Pakistani mobile');
  expect(api.post).not.toHaveBeenCalled();
  await act(async () => fill('Phone number', '03000000000'));
  jest.mocked(api.post).mockRejectedValueOnce(new Error('Network unavailable'));
  await act(async () => press('Send reset code'));
  expect(text(tree.root)).toContain('Network unavailable');
  jest.mocked(api.post).mockResolvedValueOnce({ data: { data: {} } });
  await act(async () => press('Send reset code'));
  expect(api.post).toHaveBeenLastCalledWith('/auth/forgot-password', {
    phone: '+923000000000',
  });
  expect(navigation.navigate).toHaveBeenCalledWith('ResetPassword', {
    phone: '+923000000000',
  });
});

it('shows invalid/expired codes, supports resend and logs in only after a successful reset', async () => {
  const store = configureStore({ reducer: { auth: authReducer } });
  const props = {
    navigation: { goBack: jest.fn() },
    route: { params: { phone: '+923000000000' } },
  } as unknown as React.ComponentProps<typeof ResetPassword>;
  await act(async () => {
    tree = TestRenderer.create(
      <Provider store={store}>
        <ResetPassword {...props} />
      </Provider>,
    );
  });
  await act(async () => {
    fill('Reset code', '000000');
    fill('New password', 'test-only-password');
    fill('Confirm new password', 'test-only-password');
  });
  jest
    .mocked(api.post)
    .mockRejectedValueOnce(new Error('Invalid or expired reset code'));
  await act(async () => press('Reset password'));
  expect(text(tree.root)).toContain('Invalid or expired reset code');
  expect(store.getState().auth.user).toBeNull();
  jest.mocked(api.post).mockResolvedValueOnce({ data: { data: {} } });
  await act(async () => press('Resend code'));
  expect(text(tree.root)).toContain('Use only the newest code');
  await act(async () => fill('Reset code', '000001'));
  jest
    .mocked(api.post)
    .mockResolvedValueOnce({
      data: {
        data: {
          user: { id: 'staff', role: 'STAFF' },
          accessToken: 'test-access',
          refreshToken: 'test-refresh',
        },
      },
    });
  await act(async () => press('Reset password'));
  expect(store.getState().auth.user?.role).toBe('STAFF');
  expect(api.post).toHaveBeenLastCalledWith('/auth/reset-password', {
    phone: '+923000000000',
    otp: '000001',
    newPassword: 'test-only-password',
  });
});
