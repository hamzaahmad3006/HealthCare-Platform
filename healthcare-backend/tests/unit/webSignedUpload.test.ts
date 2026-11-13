import { uploadSignedFile, SignedUpload } from '../../../healthcare-web/src/helper/signedUpload';

const signed: SignedUpload = {
  uploadUrl: 'https://api.cloudinary.com/v1_1/test/image/upload',
  fileKey: 'staff/user/CNIC/test',
  uploadParams: { api_key: 'test-key', timestamp: 123, signature: 'test-signature', public_id: 'staff/user/CNIC/test', resource_type: 'image' },
};
const file = new File(['test'], 'test.png', { type: 'image/png' });
const fetchMock = jest.fn();
const originalFetch = global.fetch;
beforeEach(() => { global.fetch = fetchMock; fetchMock.mockReset(); });
afterAll(() => { global.fetch = originalFetch; });
const valid = { public_id: signed.fileKey, secure_url: 'https://res.cloudinary.com/test/image/upload/v1/staff/user/CNIC/test.png' };

it('sends only the signed multipart fields and preserves the full public ID', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => valid });
  expect(await uploadSignedFile(file, signed)).toBe(valid.secure_url);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe(signed.uploadUrl);
  expect(options.method).toBe('POST');
  expect(options.headers).toBeUndefined(); // browser supplies the multipart boundary, no bearer token
  expect([...options.body.keys()].sort()).toEqual(['api_key', 'file', 'public_id', 'signature', 'timestamp']);
  expect(options.body.get('public_id')).toBe(signed.fileKey);
  expect(options.body.get('file').name).toBe('test.png');
});
it('propagates HTTP and network failures so callers cannot confirm an unsuccessful upload', async () => {
  fetchMock.mockResolvedValueOnce({ ok: false });
  await expect(uploadSignedFile(file, signed)).rejects.toThrow('File upload failed');
  fetchMock.mockRejectedValueOnce(new Error('Offline'));
  await expect(uploadSignedFile(file, signed)).rejects.toThrow('Offline');
});
it.each([null, {}, { ...valid, public_id: 'another-user/file' }, { ...valid, secure_url: undefined }, { ...valid, secure_url: 'http://res.cloudinary.com/test' }, { ...valid, secure_url: 'https://other.example/file' }])('rejects malformed or mismatched storage responses: %j', async data => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => data });
  await expect(uploadSignedFile(file, signed)).rejects.toThrow();
});
it('can retry the same file after failure without retaining failed form state', async () => {
  fetchMock.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => valid });
  await expect(uploadSignedFile(file, signed)).rejects.toThrow();
  await expect(uploadSignedFile(file, signed)).resolves.toBe(valid.secure_url);
  expect(fetchMock.mock.calls[0][1].body).not.toBe(fetchMock.mock.calls[1][1].body);
});
