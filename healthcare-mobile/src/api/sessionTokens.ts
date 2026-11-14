import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const options = {
  service: 'homehealth.session.tokens',
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const legacy = ['@hh_access_token', '@hh_refresh_token'];
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
let queue: Promise<unknown> = Promise.resolve();
let generation = 0;
function serialized<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work, work);
  queue = result.catch(() => undefined);
  return result;
}
export function tokenGeneration(): number {
  return generation;
}
async function removeLegacy(): Promise<void> {
  await Promise.all(legacy.map(key => AsyncStorage.removeItem(key)));
}
async function write(pair: TokenPair): Promise<void> {
  if (!pair.accessToken || !pair.refreshToken)
    throw new Error('Invalid session. Please sign in again.');
  const result = await Keychain.setGenericPassword(
    'session',
    JSON.stringify(pair),
    options,
  );
  if (!result) throw new Error('Secure session storage is unavailable.');
  await removeLegacy();
}
async function read(): Promise<TokenPair | null> {
  const stored = await Keychain.getGenericPassword(options);
  if (stored) {
    const pair = JSON.parse(stored.password) as TokenPair;
    if (
      typeof pair.accessToken !== 'string' ||
      typeof pair.refreshToken !== 'string' ||
      !pair.accessToken ||
      !pair.refreshToken
    )
      throw new Error('Invalid stored session.');
    await removeLegacy();
    return pair;
  }
  const accessToken = await AsyncStorage.getItem(legacy[0]);
  const refreshToken = await AsyncStorage.getItem(legacy[1]);
  if (!accessToken || !refreshToken) {
    await removeLegacy();
    return null;
  }
  const pair = { accessToken, refreshToken };
  await write(pair); // Delete legacy values only after secure persistence succeeds.
  return pair;
}
export function readTokens(): Promise<TokenPair | null> {
  return serialized(read);
}
export function saveTokens(pair: TokenPair): Promise<void> {
  generation++;
  return serialized(() => write(pair));
}
export function rotateTokens(
  pair: { accessToken: string; refreshToken?: string },
  expected = generation,
): Promise<boolean> {
  return serialized(async () => {
    if (expected !== generation) return false;
    const old = await read();
    if (!old) return false;
    await write({
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken ?? old.refreshToken,
    });
    generation++;
    return true;
  });
}
export function deleteTokens(): Promise<void> {
  generation++;
  return serialized(async () => {
    await Keychain.resetGenericPassword(options);
    if (await Keychain.getGenericPassword(options))
      throw new Error(
        'Could not clear secure session. Please retry signing out.',
      );
    await removeLegacy();
  });
}
