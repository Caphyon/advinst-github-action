import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as util from 'util';

import {AdvinstCommands} from './advinstcommands';

export class AdvinstBuilder {
  private toolPath: string;
  private aipPath: string;
  private aipBuildName: string;
  private aipPackageName: string;
  private aipOutputDir: string;
  private aipCommands: string[];

  private static advinstExecCmdTemplate = '%s /execute "%s" "%s"';

  constructor(toolPath: string) {
    this.toolPath = toolPath;
    this.aipPath = '';
    this.aipBuildName = '';
    this.aipPackageName = '';
    this.aipOutputDir = '';
    this.aipCommands = [];
  }

  async run(): Promise<void> {
    if (!this.aipPath) {
      return;
    }

    const advinstCommands = new AdvinstCommands([]);
    if (this.aipPackageName) {
      advinstCommands.add(
        `SetPackageName "${this.aipPackageName}" -buildname "${this.aipBuildName}"`
      );
    }

    if (this.aipOutputDir) {
      advinstCommands.add(
        `SetOutputLocation -path "${this.aipOutputDir}" -buildname "${this.aipBuildName}"`
      );
    }

    if (this.aipCommands.length > 0) {
      advinstCommands.add(this.aipCommands);
    }

    advinstCommands.add(
      this.aipBuildName ? `Build -buildslist "${this.aipBuildName}"` : `Build`
    );

    let commandsFile = '';
    try {
      commandsFile = await advinstCommands.toCommandsFile();
      const cmd = util.format(
        AdvinstBuilder.advinstExecCmdTemplate,
        this.toolPath,
        this.aipPath,
        commandsFile
      );

      const ret = await exec.getExecOutput(cmd);
      if (ret.exitCode !== 0) {
        throw new Error(ret.stdout);
      }
    } catch (error) {
      throw error;
    } finally {
      if (commandsFile) {
        io.rmRF(commandsFile);
      }
    }
  }

  setAipPath(aipPath: string): void {
    this.aipPath = aipPath;
  }

  setAipBuildName(aipBuildName: string): void {
    this.aipBuildName = aipBuildName;
  }

  setAipPackageName(aipPackageName: string): void {
    this.aipPackageName = aipPackageName;
  }

  setAipOutputDir(aipOutputDir: string): void {
    this.aipOutputDir = aipOutputDir;
  }

  setAipCommands(aipCommands: string): void {
    this.aipCommands = aipCommands.split('\n');
  }
}
