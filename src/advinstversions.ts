import * as fs from 'fs';
import * as toolCache from '@actions/tool-cache';
import {ConfigIniParser} from 'config-ini-parser';
import {compareVersions} from 'compare-versions';
import {getVariable} from './utils';

const advinstIniUrlVar = 'advancedinstaller_ini_url';
const DEFAULT_ADVINST_INI_URL =
  'https://www.advancedinstaller.com/downloads/updates-cicd-integration.ini';

export class AdvinstVersions {
  private _ini: ConfigIniParser | null = null;

  private async _getIni(): Promise<ConfigIniParser> {
    if (!this._ini) {
      const url = getVariable(advinstIniUrlVar) || DEFAULT_ADVINST_INI_URL;
      const filePath = await toolCache.downloadTool(url);
      const content = _readTextFileWithDetectedEncoding(filePath);
      const ini = new ConfigIniParser();
      ini.parse(content);
      if (ini.sections().length === 0) {
        throw new Error('Invalid updated config file');
      }
      this._ini = ini;
    }
    return this._ini;
  }

  async getAll(): Promise<string[]> {
    const ini = await this._getIni();
    return ini.sections().map(s => ini.get(s, 'ProductVersion'));
  }

  async getLatest(): Promise<string> {
    return (await this.getAll())[0];
  }

  async getMinAllowedAdvinstVersion(): Promise<string | null> {
    const RELEASE_INTERVAL_MONTHS = 24;
    const minReleaseDate = new Date();
    minReleaseDate.setMonth(minReleaseDate.getMonth() - RELEASE_INTERVAL_MONTHS);

    const ini = await this._getIni();
    const section = ini.sections().find(s => {
      const [day, month, year] = ini.get(s, 'ReleaseDate').split('/');
      return minReleaseDate > new Date(`${year}-${month}-${day}`);
    });

    return section ? ini.get(section, 'ProductVersion') : null;
  }

  async versionIsDeprecated(
    version: string
  ): Promise<[boolean, string | null]> {
    const minAllowedVer = await this.getMinAllowedAdvinstVersion();
    const isDeprecated =
      minAllowedVer !== null && compareVersions(version, minAllowedVer) === -1;
    return [isDeprecated, minAllowedVer];
  }
}

function _readTextFileWithDetectedEncoding(filePath: string): string {
  const raw = fs.readFileSync(filePath);
  const encoding = raw.length >= 2 && raw[0] === 0xff && raw[1] === 0xfe ? 'utf16le' : 'utf8';
  return raw.toString(encoding);
}

