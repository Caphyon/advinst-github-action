import {getRunnerTempDir, getVariable} from './utils';
import {format} from 'path';
import {promises} from 'fs';

export class AdvinstCommands {
  private commands: string[] = [];

  constructor(commands: string[]) {
    this.commands = commands;
  }

  add(command: string | string[]): void {
    this.commands = this.commands.concat(command);
  }

  async toCommandsFile(): Promise<string> {
    let commandsFileContent: string[] = [';aic;'];
    commandsFileContent = commandsFileContent.concat(this.commands);

    const commandsFile = format({
      dir: getRunnerTempDir(),
      ext: '.aic',
      name: getVariable('GITHUB_RUN_ID')
    });

    await promises.writeFile(commandsFile, commandsFileContent.join('\r\n'), {
      encoding: 'utf8'
    });
    return commandsFile;
  }
}
