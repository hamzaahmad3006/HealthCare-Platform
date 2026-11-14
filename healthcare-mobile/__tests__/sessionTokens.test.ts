import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {
  readTokens,
  saveTokens,
  rotateTokens,
  deleteTokens,
  tokenGeneration,
} from '../src/api/sessionTokens';
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest'),
);
const pair = { accessToken: 'test-access', refreshToken: 'test-refresh' };
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  jest.mocked(Keychain.getGenericPassword).mockResolvedValue(false);
  jest
    .mocked(Keychain.setGenericPassword)
    .mockResolvedValue({
      service: 'test',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
});
it('migrates before deleting plaintext', async () => {
  await AsyncStorage.setMany({
    '@hh_access_token': pair.accessToken,
    '@hh_refresh_token': pair.refreshToken,
  });
  expect(await readTokens()).toEqual(pair);
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'session',
    JSON.stringify(pair),
    expect.objectContaining({
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  );
  expect(await AsyncStorage.getItem('@hh_access_token')).toBeNull();
  expect(await AsyncStorage.getItem('@hh_refresh_token')).toBeNull();
});
it('fails closed if secure migration fails', async () => {
  await AsyncStorage.setMany({
    '@hh_access_token': pair.accessToken,
    '@hh_refresh_token': pair.refreshToken,
  });
  jest
    .mocked(Keychain.setGenericPassword)
    .mockRejectedValueOnce(new Error('Locked'));
  await expect(readTokens()).rejects.toThrow('Locked');
  expect(await AsyncStorage.getItem('@hh_refresh_token')).toBe(
    pair.refreshToken,
  );
});
it('never saves new tokens in plaintext', async () => {
  await saveTokens(pair);
  expect(Keychain.setGenericPassword).toHaveBeenCalled();
  expect(await AsyncStorage.getItem('@hh_access_token')).toBeNull();
});
it('rejects late refresh after logout', async () => {
  const previous = tokenGeneration();
  await deleteTokens();
  expect(await rotateTokens(pair, previous)).toBe(false);
  expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
});

it('preserves the refresh token when only access is rotated', async () => {
  jest
    .mocked(Keychain.getGenericPassword)
    .mockResolvedValue({
      username: 'session',
      password: JSON.stringify(pair),
      service: 'test',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
  expect(await rotateTokens({ accessToken: 'new-access' })).toBe(true);
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'session',
    JSON.stringify({ ...pair, accessToken: 'new-access' }),
    expect.anything(),
  );
});
it('reports a failed secure deletion instead of claiming logout succeeded', async () => {
  jest
    .mocked(Keychain.getGenericPassword)
    .mockResolvedValue({
      username: 'session',
      password: JSON.stringify(pair),
      service: 'test',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
  await expect(deleteTokens()).rejects.toThrow(
    'Could not clear secure session',
  );
});
