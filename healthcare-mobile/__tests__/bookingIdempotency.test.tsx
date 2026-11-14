import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { api } from '../src/api/client';
import { useNewBooking } from '../src/screens/dashboard/NewBooking/useNewBooking';
import type { BookingDraft } from '../src/types/useNewBooking.types';

jest.mock('../src/api/client', () => ({ api: { get: jest.fn(), post: jest.fn() }, extractApiError: (error: Error) => error.message }));
let current: ReturnType<typeof useNewBooking>;
let tree: TestRenderer.ReactTestRenderer;
function Harness(): null { current = useNewBooking(); return null; }
const draft: BookingDraft = { packageId: 'pkg', serviceTypeId: 'svc', patientId: 'patient', addressId: 'address', cityId: 'city', date: '2035-01-01', time: '12:00', urgency: 'NORMAL', gender: '', instructions: '' };
const post = api.post as jest.Mock;
beforeEach(async () => {
  jest.resetAllMocks();
  (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
  post.mockResolvedValue({ data: { data: { id: 'booking' } } });
  await act(async () => { tree = TestRenderer.create(<Harness />); });
});
afterEach(async () => { await act(async () => tree.unmount()); });

it('reuses the key after an ambiguous network failure and preserves the request body', async () => {
  post.mockRejectedValueOnce(new Error('Network timeout'));
  await act(async () => { await expect(current.createBooking(draft)).rejects.toThrow('Network timeout'); });
  await act(async () => { expect(await current.createBooking(draft)).toBe('booking'); });
  expect(post.mock.calls[1]).toEqual(post.mock.calls[0]);
  expect(post.mock.calls[0][2].headers['X-Idempotency-Key']).toMatch(/^mbk-/);
});
it('uses a fresh key when the booking details change', async () => {
  await act(async () => { await current.createBooking(draft); });
  await act(async () => { await current.createBooking({ ...draft, instructions: 'New instructions' }); });
  expect(post.mock.calls[1][2].headers['X-Idempotency-Key']).not.toBe(post.mock.calls[0][2].headers['X-Idempotency-Key']);
  expect(post.mock.calls[1][1].specialInstructions).toBe('New instructions');
});
it('coalesces double taps while the first request is pending', async () => {
  let resolve!: (response: { data: { data: { id: string } } }) => void;
  post.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await act(async () => {
    const first = current.createBooking(draft);
    const duplicate = current.createBooking(draft);
    expect(post).toHaveBeenCalledTimes(1);
    await expect(current.createBooking({ ...draft, instructions: 'changed' })).rejects.toThrow('Please wait');
    resolve({ data: { data: { id: 'booking' } } });
    expect(await first).toBe('booking'); expect(await duplicate).toBe('booking');
  });
  expect(current.submitting).toBe(false);
});
