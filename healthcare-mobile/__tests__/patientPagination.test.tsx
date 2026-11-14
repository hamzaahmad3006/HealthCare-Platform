import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { api } from '../src/api/client';
import { useMyPatients } from '../src/screens/dashboard/MyPatients/useMyPatients';

jest.mock('../src/api/client', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  extractApiError: (err: Error) => err.message,
}));
const get = api.get as jest.Mock;
let current: ReturnType<typeof useMyPatients>;
let tree: TestRenderer.ReactTestRenderer;
function Harness(): null { current = useMyPatients(); return null; }
const rows = (page: number) => page === 1
  ? Array.from({ length: 20 }, (_, index) => ({ id: `patient-${index + 1}`, fullName: `Patient ${index + 1}` }))
  : [{ id: 'patient-20', fullName: 'Patient 20' }, { id: 'patient-21', fullName: 'Patient 21' }];
const response = (page: number) => ({ data: { success: true, data: rows(page), meta: { hasNext: page === 1 } } });
async function mount(): Promise<void> {
  await act(async () => { tree = TestRenderer.create(<Harness />); });
}
beforeEach(() => {
  jest.clearAllMocks();
  get.mockImplementation(async (_url, { params }) => response(params.page));
});
afterEach(async () => { if (tree) await act(async () => tree.unmount()); });

it('loads all pages once, deduplicates overlapping records, and stops at the last page', async () => {
  await mount();
  expect(current.patients).toHaveLength(20);
  expect(get).toHaveBeenCalledWith('/users/patients', { params: { page: 1, limit: 20 } });
  await act(async () => current.loadMore());
  expect(get).toHaveBeenLastCalledWith('/users/patients', { params: { page: 2, limit: 20 } });
  expect(current.patients).toHaveLength(21);
  expect(current.patients[20].id).toBe('patient-21');
  await act(async () => current.loadMore());
  expect(get).toHaveBeenCalledTimes(2);
});
it('shows a first-page error and retries instead of claiming the list is empty', async () => {
  get.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(response(1));
  await mount();
  expect(current.error).toBe('Offline');
  expect(current.patients).toEqual([]);
  await act(async () => current.retry());
  expect(current.error).toBeNull();
  expect(current.patients).toHaveLength(20);
});
it('keeps loaded patients and retries the failed page', async () => {
  await mount();
  get.mockRejectedValueOnce(new Error('Temporary failure')).mockResolvedValueOnce(response(2));
  await act(async () => current.loadMore());
  expect(current.error).toBe('Temporary failure');
  expect(current.patients).toHaveLength(20);
  await act(async () => current.retry());
  expect(get).toHaveBeenLastCalledWith('/users/patients', { params: { page: 2, limit: 20 } });
  expect(current.patients).toHaveLength(21);
});
it('refreshes from page one after adding a patient', async () => {
  await mount();
  await act(async () => current.loadMore());
  (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
  await act(async () => { expect(await current.savePatient({ fullName: 'New Patient' })).toBe(true); });
  expect(get).toHaveBeenLastCalledWith('/users/patients', { params: { page: 1, limit: 20 } });
  expect(current.patients).toHaveLength(20);
});
