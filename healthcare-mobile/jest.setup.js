const { jest, beforeEach } = require('@jest/globals');

jest.mock('react-native-keychain', () => ({
  STORAGE_TYPE: { AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth' },
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly' },
  getGenericPassword: jest.fn(async () => false),
  setGenericPassword: jest.fn(async () => ({ service: 'test' })),
  resetGenericPassword: jest.fn(async () => true),
}));

beforeEach(() => {
  const keychain = require('react-native-keychain');
  keychain.getGenericPassword.mockResolvedValue(false);
  keychain.setGenericPassword.mockResolvedValue({ service: 'test' });
  keychain.resetGenericPassword.mockResolvedValue(true);
});
