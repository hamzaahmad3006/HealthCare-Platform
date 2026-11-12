/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
// Mock native services at the bridge boundary; render the real app/navigators.
jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest'));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(), types: { pdf: 'application/pdf', images: 'image/*' },
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' }, isErrorWithCode: () => false,
}));
jest.mock('@react-native-community/geolocation', () => ({ getCurrentPosition: jest.fn() }));
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    onNotificationOpenedApp: () => jest.fn(),
    getInitialNotification: async () => null,
  }),
}));
import App from '../App';

test('renders the unauthenticated app and cleans up its startup timer', async () => {
  jest.useFakeTimers();
  let renderer: ReactTestRenderer.ReactTestRenderer;
  try {
    await ReactTestRenderer.act(async () => { renderer = ReactTestRenderer.create(<App />); });
    expect(JSON.stringify(renderer!.toJSON())).toContain('HomeHealth');
    await ReactTestRenderer.act(async () => { renderer!.unmount(); });
  } finally {
    jest.clearAllTimers();
    jest.useRealTimers();
  }
});
