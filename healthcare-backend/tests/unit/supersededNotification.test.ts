jest.mock('../../src/config/env', () => ({}));
jest.mock('../../src/config/database', () => ({ prisma: { notificationLog: { findUnique: jest.fn(), update: jest.fn() } } }));
jest.mock('../../src/config/redis', () => ({ usingRedis: false, redis: {} }));
jest.mock('../../src/config/firebase', () => ({ pushEnabled: false }));
jest.mock('../../src/helper/axios', () => ({ sendWhatsAppMessage: jest.fn() }));
jest.mock('../../src/services/notification/pushDispatch', () => ({ dispatchPush: jest.fn() }));
jest.mock('../../src/utils/logger', () => ({ logger: { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
import { processNotification } from '../../worker/notification.worker';
import { prisma } from '../../src/config/database';
import { sendWhatsAppMessage } from '../../src/helper/axios';

it('does not dispatch a queued notification for a superseded visit', async () => {
  jest.mocked(prisma.notificationLog.findUnique).mockResolvedValue({ providerError: 'VISIT_SUPERSEDED', status: 'FAILED' } as Awaited<ReturnType<typeof prisma.notificationLog.findUnique>>);
  await processNotification('old-assignment');
  expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  expect(prisma.notificationLog.update).not.toHaveBeenCalled();
});
