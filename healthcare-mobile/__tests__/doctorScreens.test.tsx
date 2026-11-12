import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import { api } from '../src/api/client';
import { DoctorPicker } from '../src/components/DoctorPicker';
import { useBookingDetail } from '../src/screens/dashboard/BookingDetail/useBookingDetail';
import { DoctorRequests } from '../src/screens/staff/DoctorRequests/DoctorRequests';

jest.mock('../src/api/client', () => ({
  api: { get: jest.fn(), patch: jest.fn() },
  extractApiError: (err: Error) => err.message,
}));
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { refreshKey: mockRefreshKey } }),
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]),
}));
let mockRefreshKey: number | undefined;
let tree: TestRenderer.ReactTestRenderer;
const doctor = { userId: 'doctor', experienceYears: 5, user: { fullName: 'Dr Test' } };
const booking = {
  id: 'booking',
  bookingNumber: 'HH-1',
  status: 'PENDING_DOCTOR',
  requestedStartAt: '2035-01-02T09:00:00Z',
  proposedStartAt: null,
  patient: { fullName: 'Patient', primaryCondition: null },
  package: { name: 'Doctor visit' },
  city: { name: 'Faisalabad' },
};
const label = (node: TestRenderer.ReactTestInstance): string =>
  node.children.map(child => (typeof child === 'string' ? child : label(child))).join('');
const press = (text: string) =>
  tree.root
    .findAll(
      node => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function',
    )
    .find(node => label(node).includes(text))!
    .props.onPress();
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  mockRefreshKey = undefined;
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

it('loads city-filtered doctors, retries errors and submits a selected doctor', async () => {
  const select = jest.fn();
  jest
    .mocked(api.get)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ data: { data: [doctor] } });
  await act(async () => {
    tree = TestRenderer.create(<DoctorPicker cityId="city" selectedId={null} onSelect={select} />);
  });
  expect(label(tree.root)).toContain('Offline');
  await act(async () => press('Retry doctors'));
  expect(api.get).toHaveBeenLastCalledWith('/staff/doctors?cityId=city');
  await act(async () => press('Dr Test'));
  expect(select).toHaveBeenCalledWith(doctor);
});

it('does not request confidential bookings for staff without doctor eligibility', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { data: { canManageDoctorRequests: false } } });
  await act(async () => {
    tree = TestRenderer.create(<DoctorRequests />);
  });
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(label(tree.root)).toContain('verified visiting doctors');
});

it('accepts a request and refetches the pending list', async () => {
  jest
    .mocked(api.get)
    .mockImplementation(async url =>
      url === '/staff/me'
        ? { data: { data: { canManageDoctorRequests: true } } }
        : { data: { data: [booking], meta: { hasNext: false } } },
    );
  jest.mocked(api.patch).mockResolvedValue({ data: { success: true } });
  await act(async () => {
    tree = TestRenderer.create(<DoctorRequests />);
  });
  expect(label(tree.root)).toContain('Patient');
  await act(async () => press('Accept request'));
  expect(api.patch).toHaveBeenCalledWith('/bookings/booking/doctor-accept');
  expect(api.get).toHaveBeenCalledTimes(4);
});

it('shows request errors with a retry and an empty state after recovery', async () => {
  let fail = true;
  jest.mocked(api.get).mockImplementation(async url => {
    if (url === '/staff/me') return { data: { data: { canManageDoctorRequests: true } } };
    if (fail) throw new Error('Request failed');
    return { data: { data: [], meta: { hasNext: false } } };
  });
  await act(async () => {
    tree = TestRenderer.create(<DoctorRequests />);
  });
  expect(label(tree.root)).toContain('Request failed');
  fail = false;
  await act(async () => press('Retry requests'));
  expect(label(tree.root)).toContain('No pending doctor requests');
});

it('proposes a local future time and refreshes into awaiting-customer state', async () => {
  let proposed = false;
  jest.mocked(api.get).mockImplementation(async url =>
    url === '/staff/me'
      ? { data: { data: { canManageDoctorRequests: true } } }
      : {
          data: {
            data: [
              {
                ...booking,
                status: proposed ? 'TIME_PROPOSED' : 'PENDING_DOCTOR',
                proposedStartAt: proposed ? '2035-01-02T09:00:00Z' : null,
              },
            ],
            meta: { hasNext: false },
          },
        },
  );
  jest.mocked(api.patch).mockImplementation(async () => {
    proposed = true;
    return { data: {} };
  });
  await act(async () => {
    tree = TestRenderer.create(<DoctorRequests />);
  });
  await act(async () => press('Propose another time'));
  await act(async () => {
    tree.root
      .findAllByProps({ accessibilityLabel: 'Proposal date' })[0]
      .props.onChangeText('2035-01-02');
    tree.root
      .findAllByProps({ accessibilityLabel: 'Proposal time' })[0]
      .props.onChangeText('09:00');
  });
  await act(async () => press('Send proposal'));
  expect(api.patch).toHaveBeenCalledWith('/bookings/booking/doctor-propose-time', {
    proposedStartAt: new Date(2035, 0, 2, 9, 0).toISOString(),
  });
  expect(label(tree.root)).toContain('Awaiting customer response');
});

it('keeps a failed time proposal open for retry', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  jest
    .mocked(api.get)
    .mockImplementation(async url =>
      url === '/staff/me'
        ? { data: { data: { canManageDoctorRequests: true } } }
        : { data: { data: [booking], meta: { hasNext: false } } },
    );
  jest.mocked(api.patch).mockRejectedValue(new Error('Network unavailable'));
  await act(async () => {
    tree = TestRenderer.create(<DoctorRequests />);
  });
  await act(async () => press('Propose another time'));
  await act(async () => {
    tree.root
      .findAllByProps({ accessibilityLabel: 'Proposal date' })[0]
      .props.onChangeText('2035-01-02');
  });
  await act(async () => press('Send proposal'));
  expect(Alert.alert).toHaveBeenCalled();
  expect(label(tree.root)).toContain('Send proposal');
  expect(tree.root.findAllByProps({ accessibilityLabel: 'Proposal date' })[0].props.value).toBe(
    '2035-01-02',
  );
});

it.each([true, false])(
  'refreshes customer booking state after a proposal response: %s',
  async accept => {
    let status = 'TIME_PROPOSED';
    let detail: ReturnType<typeof useBookingDetail>;
    const navigation = { setOptions: jest.fn() } as unknown as Parameters<
      typeof useBookingDetail
    >[0];
    const route = { params: { id: 'booking' } } as Parameters<typeof useBookingDetail>[1];
    function Harness() {
      detail = useBookingDetail(navigation, route);
      return null;
    }
    jest.mocked(api.get).mockImplementation(async () => ({
      data: {
        data: {
          ...booking,
          status,
          preferredDoctorUserId: 'doctor',
          proposedStartAt: status === 'TIME_PROPOSED' ? '2035-01-02T09:00:00Z' : null,
        },
      },
    }));
    jest.mocked(api.patch).mockImplementation(async () => {
      status = accept ? 'PENDING' : 'CANCELLED';
      return { data: {} };
    });
    await act(async () => {
      tree = TestRenderer.create(<Harness />);
    });
    expect(detail!.canCancel).toBe(true);
    await act(async () => detail!.handleTimeResponse(accept));
    expect(api.patch).toHaveBeenCalledWith(
      `/bookings/booking/customer-${accept ? 'accept' : 'decline'}-time`,
    );
    expect(detail!.booking?.status).toBe(accept ? 'PENDING' : 'CANCELLED');
    expect(detail!.actingTime).toBe(false);
  },
);

it('refreshes an already-open doctor requests screen when a notification key changes', async () => {
  jest
    .mocked(api.get)
    .mockImplementation(async url =>
      url === '/staff/me'
        ? { data: { data: { canManageDoctorRequests: true } } }
        : { data: { data: [booking], meta: { hasNext: false } } },
    );
  await act(async () => {
    tree = TestRenderer.create(<DoctorRequests />);
  });
  mockRefreshKey = 123;
  await act(async () => {
    tree.update(<DoctorRequests />);
  });
  expect(api.get).toHaveBeenLastCalledWith('/bookings?doctorRequestsOnly=true&page=1&limit=20', {
    headers: { 'Cache-Control': 'no-cache' },
  });
  expect(api.get).toHaveBeenCalledTimes(4);
});
