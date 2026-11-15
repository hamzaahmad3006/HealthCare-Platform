import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Alert, Linking } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../src/api/client';
import { saveTokens } from '../src/api/sessionTokens';
import authReducer, { login, ADMIN_BLOCKED_MESSAGE } from '../src/store/slices/authSlice';
import { useHome } from '../src/screens/dashboard/Home/useHome';
import { BookingDetail } from '../src/screens/dashboard/BookingDetail/BookingDetail';
import { MyBookings } from '../src/screens/dashboard/MyBookings/MyBookings';
import { MyReports } from '../src/screens/dashboard/MyReports/MyReports';
import { StaffVisits } from '../src/screens/staff/Visits/StaffVisits';
import { VisitDetail } from '../src/screens/staff/VisitDetail/VisitDetail';
import { StaffReports } from '../src/screens/staff/Reports/StaffReports';
import { Notifications } from '../src/screens/shared/Notifications/Notifications';
import { StaffProfile } from '../src/screens/staff/Profile/StaffProfile';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest'),
);
jest.mock('../src/api/client', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  STORAGE_KEYS: {
    USER: 'user',
    ACCESS_TOKEN: 'access',
    REFRESH_TOKEN: 'refresh',
  },
  extractApiError: (err: Error) => err.message,
}));
jest.mock('../src/api/sessionTokens', () => ({
  saveTokens: jest.fn(),
  readTokens: jest.fn(),
  rotateTokens: jest.fn(),
  deleteTokens: jest.fn(),
  tokenGeneration: () => 1,
}));
jest.mock('../src/utils/deviceId', () => ({
  getDeviceId: async () => 'test-device',
}));
jest.mock('../src/utils/location', () => ({
  getCurrentCoords: jest.fn(async () => ({ latitude: 31.418, longitude: 73.079 })),
}));
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  types: { pdf: 'application/pdf', images: 'image/*' },
  isErrorWithCode: () => false,
  errorCodes: { OPERATION_CANCELED: 'cancelled' },
}));

const mockNavigate = jest.fn();
let mockRouteParams: { id: string } = { id: 'visit-1' };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), setOptions: jest.fn() }),
  useRoute: () => ({ params: mockRouteParams }),
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]),
  createNavigationContainerRef: () => ({ isReady: () => true, navigate: jest.fn() }),
}));

let tree: TestRenderer.ReactTestRenderer;

const labelOf = (node: TestRenderer.ReactTestInstance): string =>
  node.children.map((child) => (typeof child === 'string' ? child : labelOf(child))).join('');

const pressButton = (text: string) => {
  const btn = tree.root
    .findAll((n) => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function')
    .find((n) => labelOf(n).includes(text));
  if (!btn) {
    throw new Error(`Button containing "${text}" not found`);
  }
  return btn.props.onPress();
};

function makeStore(role: 'CUSTOMER' | 'STAFF' = 'CUSTOMER') {
  const initial = authReducer(undefined, { type: 'init' });
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        ...initial,
        user: {
          id: `${role.toLowerCase()}-1`,
          role,
          fullName: role === 'STAFF' ? 'Dr Sara Ahmed' : 'Ali Raza',
          phone: '+923001112233',
          email: null,
          avatarUrl: null,
        },
      },
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  mockRouteParams = { id: 'visit-1' };
});

afterEach(async () => {
  if (tree) {
    await act(async () => tree.unmount());
  }
  jest.restoreAllMocks();
});

it('includes RESCHEDULED bookings in Customer Home upcoming appointment card', async () => {
  let homeState!: ReturnType<typeof useHome>;
  function Harness() {
    homeState = useHome();
    return null;
  }
  const futureIso = new Date(Date.now() + 86_400_000).toISOString();
  jest.mocked(api.get).mockImplementation(async (url) => {
    if (url === '/bookings') {
      return {
        data: {
          success: true,
          data: [
            {
              id: 'b-resched',
              bookingNumber: 'HH-RESCHED-1',
              status: 'RESCHEDULED',
              requestedStartAt: futureIso,
              serviceType: { id: 'svc-1', name: 'Home Nursing', code: 'NURSING' },
              package: { id: 'pkg-1', name: 'Daily Nursing Visit' },
            },
          ],
        },
      };
    }
    return { data: { success: true, data: [] } };
  });

  const store = makeStore('CUSTOMER');
  await act(async () => {
    tree = TestRenderer.create(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );
  });

  expect(homeState.nextBooking?.id).toBe('b-resched');
  expect(homeState.nextBooking?.status).toBe('RESCHEDULED');
});

it('shows an error and retries on MyBookings instead of rendering a false empty state', async () => {
  const futureIso = new Date(Date.now() + 86_400_000).toISOString();
  jest
    .mocked(api.get)
    .mockRejectedValueOnce(new Error('Bookings service unavailable'))
    .mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 'b-1',
            bookingNumber: 'HH-2026-0001',
            status: 'CONFIRMED',
            requestedStartAt: futureIso,
            currency: 'PKR',
            totalPrice: '2500',
            serviceType: { id: 'svc-1', name: 'Home Nursing', code: 'NURSING' },
            package: { id: 'pkg-1', name: 'Single Visit' },
          },
        ],
      },
    });

  await act(async () => {
    tree = TestRenderer.create(<MyBookings />);
  });

  expect(labelOf(tree.root)).toContain('Could not load bookings');
  expect(labelOf(tree.root)).toContain('Bookings service unavailable');
  expect(labelOf(tree.root)).not.toContain('No bookings yet');

  await act(async () => pressButton('Retry'));

  expect(labelOf(tree.root)).toContain('HH-2026-0001');
  expect(labelOf(tree.root)).toContain('Home Nursing');
});

it('shows an error and retries on MyReports and handles file open failures safely', async () => {
  jest
    .mocked(api.get)
    .mockRejectedValueOnce(new Error('Reports offline'))
    .mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 'rep-1',
            title: 'Complete Blood Count',
            reportType: 'LAB_RESULT',
            createdAt: '2026-05-01T10:00:00Z',
            patient: { fullName: 'Ali Raza' },
            booking: { bookingNumber: 'HH-2026-0001' },
            files: [{ fileUrl: 'https://example.invalid/report.pdf' }],
          },
        ],
      },
    });

  await act(async () => {
    tree = TestRenderer.create(<MyReports />);
  });

  expect(labelOf(tree.root)).toContain('Could not load reports');
  expect(labelOf(tree.root)).not.toContain('No reports yet');

  await act(async () => pressButton('Retry'));
  expect(labelOf(tree.root)).toContain('Complete Blood Count');

  jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('No PDF viewer'));
  await act(async () => pressButton('View'));
  expect(Alert.alert).toHaveBeenCalledWith(
    'Unable to open file',
    expect.stringContaining('Could not open this report file'),
  );
});

it('shows an error and retries on StaffVisits and StaffReports instead of false empty states', async () => {
  const nowIso = new Date().toISOString();
  jest
    .mocked(api.get)
    .mockRejectedValueOnce(new Error('Visits endpoint failed'))
    .mockImplementation(async (url) => {
      if (url === '/visits') {
        return {
          data: {
            success: true,
            data: [
              {
                id: 'visit-1',
                bookingId: 'b-1',
                visitNumber: 1,
                scheduledStartAt: nowIso,
                status: 'ASSIGNED',
                booking: {
                  id: 'b-1',
                  bookingNumber: 'HH-2026-0099',
                  patientId: 'pat-1',
                  serviceType: { code: 'NURSING', name: 'Home Nursing' },
                },
              },
            ],
          },
        };
      }
      return { data: { success: true, data: [{ id: 'pat-1', fullName: 'Zainab Bibi' }] } };
    });

  await act(async () => {
    tree = TestRenderer.create(<StaffVisits />);
  });

  expect(labelOf(tree.root)).toContain('Could not load visits');
  expect(labelOf(tree.root)).not.toContain('No visits scheduled');

  await act(async () => pressButton('Retry'));
  expect(labelOf(tree.root)).toContain('Zainab Bibi');

  await act(async () => tree.unmount());

  jest
    .mocked(api.get)
    .mockRejectedValueOnce(new Error('Staff reports error'))
    .mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 'srep-1',
            title: 'Vitals Note',
            reportType: 'VISIT_NOTE',
            createdAt: nowIso,
            patient: { fullName: 'Zainab Bibi' },
            files: [],
          },
        ],
      },
    });

  await act(async () => {
    tree = TestRenderer.create(<StaffReports />);
  });

  expect(labelOf(tree.root)).toContain('Could not load reports');
  await act(async () => pressButton('Retry'));
  expect(labelOf(tree.root)).toContain('Vitals Note');
});

it('recovers from VisitDetail load error and transitions visit through en-route, check-in, check-out, and complete', async () => {
  let visitStatus = 'ASSIGNED';
  let checkOutAt: string | null = null;
  let shouldFailFirst = true;

  jest.mocked(api.get).mockImplementation(async (url) => {
    if (url === '/notifications') {
      return { data: { success: true, data: [] } };
    }
    if (url === '/visits/visit-1') {
      if (shouldFailFirst) {
        shouldFailFirst = false;
        throw new Error('Temporary network loss');
      }
      return {
        data: {
          success: true,
          data: {
            id: 'visit-1',
            bookingId: 'b-1',
            visitNumber: 1,
            scheduledStartAt: '2026-06-01T09:00:00Z',
            status: visitStatus,
            checkOutAt,
            beforeConditionText: null,
            afterConditionText: null,
            visitNotes: null,
            booking: {
              id: 'b-1',
              bookingNumber: 'HH-2026-0100',
              patientId: 'pat-1',
            },
          },
        },
      };
    }
    if (url === '/bookings/b-1') {
      return {
        data: {
          success: true,
          data: {
            id: 'b-1',
            bookingNumber: 'HH-2026-0100',
            patient: { id: 'pat-1', fullName: 'Hassan Mahmood' },
            serviceType: { id: 'svc-1', name: 'Physiotherapy', code: 'PHYSIOTHERAPY' },
            address: { line1: 'House 12, Block B', area: 'Peoples Colony' },
            city: { name: 'Faisalabad' },
          },
        },
      };
    }
    return { data: { success: true, data: [] } };
  });

  jest.mocked(api.patch).mockImplementation(async (url) => {
    if (url === '/visits/visit-1/en-route') visitStatus = 'EN_ROUTE';
    if (url === '/visits/visit-1/check-in') visitStatus = 'CHECKED_IN';
    if (url === '/visits/visit-1/check-out') checkOutAt = '2026-06-01T10:00:00Z';
    if (url === '/visits/visit-1/complete') visitStatus = 'COMPLETED';
    return { data: { success: true, data: {} } };
  });

  const store = makeStore('STAFF');
  await act(async () => {
    tree = TestRenderer.create(
      <Provider store={store}>
        <VisitDetail />
      </Provider>,
    );
  });

  expect(labelOf(tree.root)).toContain('Temporary network loss');
  await act(async () => pressButton('Retry'));

  expect(labelOf(tree.root)).toContain('Hassan Mahmood');
  expect(labelOf(tree.root)).toContain('Mark En Route');

  await act(async () => pressButton('Mark En Route'));
  expect(api.patch).toHaveBeenCalledWith('/visits/visit-1/en-route');
  expect(labelOf(tree.root)).toContain('Check In');

  await act(async () => pressButton('Check In'));
  expect(api.patch).toHaveBeenCalledWith('/visits/visit-1/check-in', {
    checkInLatitude: 31.418,
    checkInLongitude: 73.079,
  });
  expect(labelOf(tree.root)).toContain('Check Out');

  await act(async () => pressButton('Check Out'));
  expect(api.patch).toHaveBeenCalledWith('/visits/visit-1/check-out', {
    checkOutLatitude: 31.418,
    checkOutLongitude: 73.079,
  });
  expect(labelOf(tree.root)).toContain('Complete Visit');

  await act(async () => pressButton('Complete Visit'));
  expect(api.patch).toHaveBeenCalledWith('/visits/visit-1/complete');
  expect(labelOf(tree.root)).toContain('This visit is completed.');
});

it('shows an error and retries on Notifications and renders dynamic specializations on StaffProfile', async () => {
  jest
    .mocked(api.get)
    .mockRejectedValueOnce(new Error('Notification server unreachable'))
    .mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 'notif-1',
            templateCode: 'BOOKING_CONFIRMED',
            renderedContent: 'Your booking HH-2026-0100 is confirmed.',
            createdAt: '2026-06-01T08:00:00Z',
            bookingId: 'b-1',
            bookingVisitId: null,
          },
        ],
      },
    });

  const store = makeStore('CUSTOMER');
  await act(async () => {
    tree = TestRenderer.create(
      <Provider store={store}>
        <Notifications />
      </Provider>,
    );
  });

  expect(labelOf(tree.root)).toContain('Could not load notifications');
  await act(async () => pressButton('Retry'));
  expect(labelOf(tree.root)).toContain('Your booking HH-2026-0100 is confirmed.');

  await act(async () => tree.unmount());

  jest.mocked(api.get).mockImplementation(async (url) => {
    if (url === '/staff/me') {
      return {
        data: {
          success: true,
          data: {
            staffCode: 'DOC-77',
            isAvailable: true,
            experienceYears: 9,
            verificationStatus: 'VERIFIED',
            city: { name: 'Faisalabad' },
            zone: { name: 'Madina Town' },
            serviceTypes: [
              { serviceType: { id: 'svc-doc', name: 'Visiting Doctor', code: 'VISITING_DOCTOR' } },
              { serviceType: { id: 'svc-phys', name: 'Physiotherapy', code: 'PHYSIOTHERAPY' } },
            ],
          },
        },
      };
    }
    return { data: { success: true, data: [] } };
  });

  const staffStore = makeStore('STAFF');
  await act(async () => {
    tree = TestRenderer.create(
      <Provider store={staffStore}>
        <StaffProfile />
      </Provider>,
    );
  });

  expect(labelOf(tree.root)).toContain('Visiting Doctor');
  expect(labelOf(tree.root)).toContain('Physiotherapy');
  expect(labelOf(tree.root)).toContain('Faisalabad, Madina Town');
});

it('blocks ADMIN login on mobile with ADMIN_BLOCKED_MESSAGE and does not store tokens', async () => {
  jest.mocked(api.post).mockResolvedValueOnce({
    data: {
      data: {
        user: { id: 'admin-1', role: 'ADMIN', fullName: 'Platform Admin', phone: '+923000000001' },
        accessToken: 'test-admin-access',
        refreshToken: 'test-admin-refresh',
      },
    },
  });

  const store = configureStore({ reducer: { auth: authReducer } });
  const result = await store.dispatch(login({ phone: '3000000001', password: 'test-only-password' }));

  expect(login.rejected.match(result)).toBe(true);
  expect(store.getState().auth.user).toBeNull();
  expect(store.getState().auth.error).toBe(ADMIN_BLOCKED_MESSAGE);
  expect(saveTokens).not.toHaveBeenCalled();
});

it('renders BookingDetail safely when urgencyLevel and visits are omitted from the API payload', async () => {
  jest.mocked(api.get).mockResolvedValueOnce({
    data: {
      data: {
        id: 'booking-partial-1',
        bookingNumber: 'HH-2026-0999',
        status: 'PENDING',
        totalPrice: '4500',
        currency: 'PKR',
        requestedStartAt: '2026-12-01T10:00:00Z',
        serviceType: { id: 'svc-1', name: 'Visiting Doctor', code: 'VISITING_DOCTOR' },
        package: { id: 'pkg-1', name: 'Home Doctor Consultation' },
        patient: { id: 'pat-1', fullName: 'Fatima Raza' },
        address: {
          id: 'addr-1',
          line1: 'House 42, Street 5',
          area: 'Madina Town',
          contactPhone: '+923001112233',
        },
        city: { id: 'city-1', name: 'Faisalabad' },
      },
    },
  });

  const nav = { setOptions: jest.fn(), navigate: jest.fn(), goBack: jest.fn() } as never;
  const route = { key: 'BookingDetail-1', name: 'BookingDetail' as const, params: { id: 'booking-partial-1' } };

  await act(async () => {
    tree = TestRenderer.create(<BookingDetail navigation={nav} route={route} />);
  });

  expect(labelOf(tree.root)).toContain('Visiting Doctor');
  expect(labelOf(tree.root)).toContain('Urgency:');
  expect(labelOf(tree.root)).toContain('routine');
});

