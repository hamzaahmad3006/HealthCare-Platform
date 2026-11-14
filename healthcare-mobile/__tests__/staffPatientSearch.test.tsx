import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { api } from '../src/api/client';
import { useStaffPatients } from '../src/screens/staff/Patients/useStaffPatients';

jest.mock('../src/api/client', () => ({
  api: { get: jest.fn() },
  extractApiError: (error: Error) => error.message,
}));

const get = api.get as jest.Mock;
let current: ReturnType<typeof useStaffPatients>;
let tree: TestRenderer.ReactTestRenderer;
function Harness({ search }: { search: string }): null {
  current = useStaffPatients(search);
  return null;
}
const response = (ids: string[], hasNext = false) => ({
  data: { success: true, data: ids.map(id => ({ id, fullName: id })), meta: { hasNext } },
});
async function advance(ms: number): Promise<void> {
  await act(async () => { jest.advanceTimersByTime(ms); await Promise.resolve(); });
}
async function mount(search = ''): Promise<void> {
  await act(async () => { tree = TestRenderer.create(<Harness search={search} />); });
  await advance(search ? 250 : 0);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  get.mockResolvedValue(response(['first', 'second'], true));
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.useRealTimers();
});

it('pages authorized search results and retries a failed next page without losing loaded rows', async () => {
  await mount('Amina');
  expect(get).toHaveBeenCalledWith('/users/patients', { params: { page: 1, limit: 20, search: 'Amina' } });
  get.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(response(['second', 'third']));
  await act(async () => current.loadMore());
  expect(current.patients.map(patient => patient.id)).toEqual(['first', 'second']);
  expect(current.error).toBe('Offline');
  await act(async () => current.retry());
  expect(get).toHaveBeenLastCalledWith('/users/patients', { params: { page: 2, limit: 20, search: 'Amina' } });
  expect(current.patients.map(patient => patient.id)).toEqual(['first', 'second', 'third']);
  await act(async () => current.loadMore());
  expect(get).toHaveBeenCalledTimes(3);
});

it('debounces search and ignores a late response for a previous name', async () => {
  let finishOld!: (value: ReturnType<typeof response>) => void;
  get.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
    .mockResolvedValueOnce(response(['new-match']));
  await act(async () => { tree = TestRenderer.create(<Harness search="old" />); });
  await advance(250);
  await act(async () => { tree.update(<Harness search="new" />); });
  await act(async () => { finishOld(response(['old-match'])); });
  expect(current.patients).toEqual([]);
  await advance(249);
  expect(get).toHaveBeenCalledTimes(1);
  await advance(1);
  expect(get).toHaveBeenLastCalledWith('/users/patients', { params: { page: 1, limit: 20, search: 'new' } });
  expect(current.patients.map(patient => patient.id)).toEqual(['new-match']);
});

it('shows a first-page error and retries it', async () => {
  get.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(response(['recovered']));
  await mount();
  expect(current.error).toBe('Offline');
  expect(current.patients).toEqual([]);
  await act(async () => current.retry());
  expect(current.error).toBeNull();
  expect(current.patients.map(patient => patient.id)).toEqual(['recovered']);
});
