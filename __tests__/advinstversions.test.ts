import {getLatest, getAll} from '../src/advinstversions';
import * as toolCache from '@actions/tool-cache';
import path from 'path';

jest.mock('@actions/tool-cache');
const mockToolCache: jest.Mocked<typeof toolCache> = <
  jest.Mocked<typeof toolCache>
>toolCache;

test('Test getLatest', async () => {
  mockToolCache.downloadTool.mockResolvedValue(
    path.resolve(__dirname, './__data__/updates.ini')
  );
  const latest = await getLatest();
  expect(latest).toBe('19.0');
});

test('Test getAll', async () => {
  mockToolCache.downloadTool.mockResolvedValue(
    path.resolve(__dirname, './__data__/updates.ini')
  );
  const versions = await getAll();
  expect(versions).toEqual(expect.arrayContaining(['19.0', '18.9.1', '18.9']));
});
