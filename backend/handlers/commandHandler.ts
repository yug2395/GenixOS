import * as path from 'path';
import * as fs from 'fs/promises';

const PROJECT_ROOT = path.resolve(process.cwd(), 'c-engine');

interface CommandMessage {
  type: 'command';
  action: string;
  path?: string;
}

export async function handleCommand(data: CommandMessage): Promise<any> {
  const { action, path: cmdPath = '.' } = data;

  switch (action) {
    case 'ls':
      return await handleLs(cmdPath);
    case 'cd':
      return { type: 'output', output: 'cd: Directory change handled by client\n' };
    case 'mkdir':
      return await handleMkdir(cmdPath);
    case 'touch':
      return await handleTouch(cmdPath);
    case 'rm':
      return await handleRm(cmdPath);
    case 'cat':
      return await handleCat(cmdPath);
    default:
      return {
        type: 'output',
        output: `${action}: command not found\n`,
      };
  }
}

async function handleLs(cmdPath: string): Promise<any> {
  try {
    const fullPath = path.resolve(PROJECT_ROOT, cmdPath);
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { type: 'output', output: 'Permission denied\n' };
    }
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const files = entries
      .map((entry) => entry.name)
      .join('\n');
    return { type: 'output', output: files + '\n' };
  } catch (error) {
    return {
      type: 'output',
      output: `ls: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
    };
  }
}

async function handleMkdir(cmdPath: string): Promise<any> {
  try {
    const fullPath = path.resolve(PROJECT_ROOT, cmdPath);
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { type: 'output', output: 'Permission denied\n' };
    }
    await fs.mkdir(fullPath, { recursive: true });
    return { type: 'output', output: '' };
  } catch (error) {
    return {
      type: 'output',
      output: `mkdir: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
    };
  }
}

async function handleTouch(cmdPath: string): Promise<any> {
  try {
    const fullPath = path.resolve(PROJECT_ROOT, cmdPath);
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { type: 'output', output: 'Permission denied\n' };
    }
    await fs.writeFile(fullPath, '');
    return { type: 'output', output: '' };
  } catch (error) {
    return {
      type: 'output',
      output: `touch: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
    };
  }
}

async function handleRm(cmdPath: string): Promise<any> {
  try {
    const fullPath = path.resolve(PROJECT_ROOT, cmdPath);
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { type: 'output', output: 'Permission denied\n' };
    }
    await fs.rm(fullPath, { recursive: true, force: true });
    return { type: 'output', output: '' };
  } catch (error) {
    return {
      type: 'output',
      output: `rm: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
    };
  }
}

async function handleCat(cmdPath: string): Promise<any> {
  try {
    const fullPath = path.resolve(PROJECT_ROOT, cmdPath);
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { type: 'output', output: 'Permission denied\n' };
    }
    const content = await fs.readFile(fullPath, 'utf-8');
    return { type: 'output', output: content };
  } catch (error) {
    return {
      type: 'output',
      output: `cat: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
    };
  }
}

