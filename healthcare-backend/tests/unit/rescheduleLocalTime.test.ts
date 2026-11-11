import { execFileSync } from 'child_process';
import path from 'path';
import { readFileSync } from 'fs';
import ts from 'typescript';

const helper = path.resolve(__dirname, '../../../healthcare-web/src/helper/reschedule.ts');
const compiled = ts.transpileModule(readFileSync(helper, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function runInTimezone(timezone: string, expression: string): string {
  return execFileSync(process.execPath, ['-e', `const exports = {}; ${compiled}; const h = exports; ${expression}`],
    { cwd: path.resolve(__dirname, '../..'), env: { ...process.env, TZ: timezone }, encoding: 'utf8' }).trim();
}

it.each([
  ['Asia/Karachi', '2027-01-02T09:00', '2027-01-02T04:00:00.000Z'],
  ['America/New_York', '2027-01-02T09:00', '2027-01-02T14:00:00.000Z'],
])('converts local wall time to UTC in %s', (zone, local, expected) => {
  expect(runInTimezone(zone, `console.log(h.futureLocalTimeToIso('${local}', Date.parse('2026-01-01')))`)).toBe(expected);
});

it('formats the local minimum across a UTC date boundary', () => {
  expect(runInTimezone('Asia/Karachi', "console.log(h.localDateTimeValue(new Date('2027-01-01T23:00:00Z')))"))
    .toBe('2027-01-02T04:00');
});

it.each(['', 'bad', '2025-01-01T09:00', '2027-02-30T09:00', '2027-03-14T02:30'])('rejects invalid, past or nonexistent DST times: %s', value => {
  expect(runInTimezone('America/New_York', `try { h.futureLocalTimeToIso('${value}', Date.parse('2026-01-01')); console.log('accepted'); } catch { console.log('rejected'); }`))
    .toBe('rejected');
});
