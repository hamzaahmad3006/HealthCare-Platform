const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { generateApiConfig } = require('./configure-api');

function resolveAndroidSdk(env) {
  const candidates = [
    env.ANDROID_HOME,
    env.ANDROID_SDK_ROOT,
    env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, 'Android', 'Sdk') : null,
    env.HOME ? path.join(env.HOME, 'Android', 'Sdk') : null,
    env.HOME ? path.join(env.HOME, 'Library', 'Android', 'sdk') : null,
  ].filter(Boolean);

  return candidates.find((dir) => fs.existsSync(path.join(dir, 'platform-tools'))) || null;
}

function resolveJavaHome(env) {
  if (env.JAVA_HOME && fs.existsSync(path.join(env.JAVA_HOME, 'bin'))) {
    return env.JAVA_HOME;
  }
  if (process.platform === 'win32') {
    const programFiles = env.ProgramFiles || 'C:\\Program Files';
    const adoptiumRoot = path.join(programFiles, 'Eclipse Adoptium');
    if (fs.existsSync(adoptiumRoot)) {
      const jdk17 = fs
        .readdirSync(adoptiumRoot)
        .filter((name) => name.startsWith('jdk-17'))
        .sort()
        .reverse()[0];
      if (jdk17) {
        return path.join(adoptiumRoot, jdk17);
      }
    }
    const studioJbr = path.join(programFiles, 'Android', 'Android Studio', 'jbr');
    if (fs.existsSync(path.join(studioJbr, 'bin'))) {
      return studioJbr;
    }
  }
  return null;
}

function prependToPath(dir) {
  const pathKey = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') || 'PATH';
  const current = process.env[pathKey] || '';
  if (!current.toLowerCase().includes(dir.toLowerCase())) {
    process.env[pathKey] = `${dir}${path.delimiter}${current}`;
  }
}

function detectDevicesAndSetupReverse(adbBinary) {
  try {
    const output = execFileSync(adbBinary, ['devices'], { encoding: 'utf8' });
    const lines = output
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.trim())
      .filter((line) => line.endsWith('\tdevice'));

    const serials = lines.map((line) => line.split('\t')[0]);
    let hasPhysicalDevice = false;

    for (const serial of serials) {
      if (!serial.startsWith('emulator-')) {
        hasPhysicalDevice = true;
      }
      try {
        execFileSync(adbBinary, ['-s', serial, 'reverse', 'tcp:3000', 'tcp:3000'], { stdio: 'ignore' });
        execFileSync(adbBinary, ['-s', serial, 'reverse', 'tcp:8081', 'tcp:8081'], { stdio: 'ignore' });
        console.log(`Configured adb reverse (tcp:3000, tcp:8081) for device ${serial}.`);
      } catch {
        // Ignore if reverse is unsupported on a specific transport
      }
    }

    return { serials, hasPhysicalDevice };
  } catch {
    return { serials: [], hasPhysicalDevice: false };
  }
}

function main() {
  const sdkDir = resolveAndroidSdk(process.env);

  if (sdkDir) {
    process.env.ANDROID_HOME = sdkDir;
    process.env.ANDROID_SDK_ROOT = sdkDir;
    prependToPath(path.join(sdkDir, 'platform-tools'));
  }

  const javaHome = resolveJavaHome(process.env);
  if (javaHome) {
    process.env.JAVA_HOME = javaHome;
    prependToPath(path.join(javaHome, 'bin'));
  }

  const adbName = process.platform === 'win32' ? 'adb.exe' : 'adb';
  const adbBinary = sdkDir ? path.join(sdkDir, 'platform-tools', adbName) : adbName;
  const { hasPhysicalDevice } = detectDevicesAndSetupReverse(adbBinary);

  if (hasPhysicalDevice && !process.env.MOBILE_DEV_API_URL) {
    process.env.MOBILE_DEV_API_URL = 'http://127.0.0.1:3000/api/v1';
    console.log('Physical Android device detected -> using http://127.0.0.1:3000/api/v1 via adb reverse.');
  }

  generateApiConfig({ env: process.env });
  console.log('Mobile API configuration generated.');

  const startOnly = process.argv.includes('--start-only');
  const extraArgs = process.argv.slice(2).filter((arg) => arg !== '--start-only');
  const rnCli = path.join(__dirname, '../node_modules/react-native/cli.js');
  const commandArgs = [rnCli, startOnly ? 'start' : 'run-android', ...extraArgs];

  const result = spawnSync(process.execPath, commandArgs, {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });

  process.exitCode = result.status ?? 0;
}

if (require.main === module) {
  main();
}
