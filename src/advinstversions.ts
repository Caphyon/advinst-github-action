import * as fs from 'fs';
import * as toolCache from '@actions/tool-cache';
import {ConfigIniParser} from 'config-ini-parser';
import {compareVersions} from 'compare-versions';
import {getVariable} from './utils';

const advinstIniUrlVar = 'advancedinstaller_ini_url';
const DEFAULT_ADVINST_INI_URL =
  'https://www.advancedinstaller.com/downloads/updates.ini';

export async function getLatest(): Promise<string> {
  const versions = await getAll();
  return versions[0];
}

export async function getAll(): Promise<string[]> {
  const versionsFileContent = await _getUpdatesFileContent();

  const ini = new ConfigIniParser();
  ini.parse(versionsFileContent);
  const sections = ini.sections();
  if (sections.length === 0) {
    throw new Error('Invalid updated config file');
  }
  const versions: string[] = [];
  for (const section of sections) {
    versions.push(ini.get(section, 'ProductVersion'));
  }
  return versions;
}

export async function getMinAllowedAdvinstVersion(): Promise<string | null> {
  const RELEASE_INTERVAL_MONTHS = 24;

  const minReleaseDate = new Date();
  minReleaseDate.setMonth(minReleaseDate.getMonth() - RELEASE_INTERVAL_MONTHS);

  const versionsFileContent = await _getUpdatesFileContent();
  const ini = new ConfigIniParser();
  ini.parse(versionsFileContent);
  const sections = ini.sections();
  if (sections.length === 0) {
    throw new Error('Invalid updated config file');
  }

  const r = ini.sections().find(s => {
    const [day, month, year] = ini.get(s, 'ReleaseDate').split('/');
    const releaseDate = new Date(`${year}-${month}-${day}`);
    return minReleaseDate > releaseDate;
  });

  if (!r) {
    return null;
  }
  return ini.get(r, 'ProductVersion');
}

export async function versionIsDeprecated(
  version: string
): Promise<[boolean, string | null]> {
  const minAllowedVer = await getMinAllowedAdvinstVersion();
  const isDeprecated: boolean =
    minAllowedVer !== null && compareVersions(version, minAllowedVer) === -1;
  return [isDeprecated, minAllowedVer];
}

async function _getUpdatesFileContent(): Promise<string> {
  const advinstIniUrl =
    getVariable(advinstIniUrlVar) || DEFAULT_ADVINST_INI_URL;
  const updatesFile: string = await toolCache.downloadTool(advinstIniUrl);
  return _readTextFileWithDetectedEncoding(updatesFile);
}

function _readTextFileWithDetectedEncoding(filePath: string): string {
  const raw = fs.readFileSync(filePath);
  const encoding = _hasUtf16LeBom(raw) ? 'utf16le' : 'utf8';
  return raw.toString(encoding);
}

function _hasUtf16LeBom(raw: Buffer): boolean {
  return raw.length >= 2 && raw[0] === 0xff && raw[1] === 0xfe;
}
