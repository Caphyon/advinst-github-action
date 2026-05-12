import * as toolCache from '@actions/tool-cache';
import {AdvinstVersions} from '../src/advinstversions';
import path from 'path';

jest.mock('@actions/tool-cache');
const mockToolCache: jest.Mocked<typeof toolCache> = <
  jest.Mocked<typeof toolCache>
>toolCache;

const testIniPath = path.resolve(__dirname, './__data__/updates.ini');

test('Test getLatest', async () => {
  mockToolCache.downloadTool.mockResolvedValue(testIniPath);
  const latest = await new AdvinstVersions().getLatest();
  expect(latest).toBe('21.0.1');
});

test('Test getAll', async () => {
  mockToolCache.downloadTool.mockResolvedValue(testIniPath);
  const versions = await new AdvinstVersions().getAll();
  expect(versions).toEqual(
    expect.arrayContaining(['21.0.1', '21.0', '19.0', '18.9.1', '18.9', '16.0'])
  );
});

test('Test getMinAllowedAdvinstVersion', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2023-09-01'));
  mockToolCache.downloadTool.mockResolvedValue(testIniPath);
  const ver = await new AdvinstVersions().getMinAllowedAdvinstVersion();
  expect(ver).toBe('18.6.1');
  jest.useRealTimers();
});

test('Test versionIsDeprecated', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2023-09-01'));
  mockToolCache.downloadTool.mockResolvedValue(testIniPath);

  const versions = new AdvinstVersions();
  let [isDeprecated, minAllowedVer] = await versions.versionIsDeprecated('16.0');
  expect(minAllowedVer).toBe('18.6.1');
  expect(isDeprecated).toBe(true);

  [isDeprecated, minAllowedVer] = await versions.versionIsDeprecated('18.9');
  expect(minAllowedVer).toBe('18.6.1');
  expect(isDeprecated).toBe(false);

  [isDeprecated, minAllowedVer] = await versions.versionIsDeprecated('18.6.1');
  expect(minAllowedVer).toBe('18.6.1');
  expect(isDeprecated).toBe(false);

  jest.useRealTimers();
});
