import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

const PROJECT_ROOT = path.resolve(process.cwd(), 'c-engine');
const GENIX_FILES_ROOT = path.resolve(process.cwd(), 'GenixFiles');
const SANDBOX_ROOT = path.resolve(PROJECT_ROOT, 'sandbox');

interface BuildMessage {
  type: 'build';
  action: 'compile' | 'run';
  file: string;
}

// Find the file in either c-engine or GenixFiles
// Prioritizes GenixFiles (where GenixCode saves) over c-engine
async function findFile(fileName: string): Promise<string | null> {
  // Try GenixFiles first (where GenixCode saves - this should be the most up-to-date)
  const genixFilesPath = path.resolve(GENIX_FILES_ROOT, fileName);
  try {
    await fs.access(genixFilesPath);
    console.log(`[BuildHandler] Found file in GenixFiles: ${genixFilesPath}`);
    return genixFilesPath;
  } catch {
    // Fall back to c-engine (original location)
    const cEnginePath = path.resolve(PROJECT_ROOT, fileName);
    try {
      await fs.access(cEnginePath);
      console.log(`[BuildHandler] Found file in c-engine: ${cEnginePath}`);
      return cEnginePath;
    } catch {
      console.log(`[BuildHandler] File not found: ${fileName}`);
      return null;
    }
  }
}

export async function handleBuild(data: BuildMessage): Promise<any> {
  const { action, file } = data;

  // Find the file in either location
  const fullPath = await findFile(file);
  
  if (!fullPath) {
    return { type: 'error', message: `File not found: ${file}. Make sure the file exists in c-engine or GenixFiles.` };
  }
  
  // Security check - ensure file is in one of the allowed directories
  if (!fullPath.startsWith(PROJECT_ROOT) && !fullPath.startsWith(GENIX_FILES_ROOT)) {
    return { type: 'error', message: 'Permission denied: File outside allowed directories' };
  }

  // If file is in GenixFiles, copy it to c-engine to ensure we're using the latest version
  // This ensures consistency and that the compiler uses the most recent code
  let compilePath = fullPath;
  if (fullPath.startsWith(GENIX_FILES_ROOT)) {
    const targetPath = path.resolve(PROJECT_ROOT, file);
    try {
      const fileContent = await fs.readFile(fullPath, 'utf-8');
      await fs.writeFile(targetPath, fileContent, 'utf-8');
      compilePath = targetPath;
      console.log(`[BuildHandler] Copied ${fullPath} to ${targetPath} for compilation`);
    } catch (error) {
      console.error(`[BuildHandler] Error copying file: ${error}`);
      // Continue with original path if copy fails
    }
  }

  try {
    switch (action) {
      case 'compile':
        return await handleCompile(compilePath);
      case 'run':
        return await handleRun(compilePath);
      default:
        return { type: 'error', message: 'Unknown build action' };
    }
  } catch (error) {
    return {
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function handleCompile(filePath: string): Promise<any> {
  await fs.mkdir(SANDBOX_ROOT, { recursive: true }).catch(() => {
    // ignore mkdir errors
  });

  return new Promise((resolve) => {
    const ext = path.extname(filePath);
    const isCpp = ext === '.cpp' || ext === '.cxx' || ext === '.cc';
    const compiler = isCpp ? 'g++' : 'gcc';
    
    const baseName = path.basename(filePath, ext);
    // On Windows, gcc/g++ automatically adds .exe, but we'll be explicit
    const outputPath = path.join(SANDBOX_ROOT, baseName + (process.platform === 'win32' ? '.exe' : ''));
    
    const compileProcess = spawn(compiler, [
      filePath,
      '-o',
      outputPath,
      '-Wall',
      '-Wextra',
    ]);

    let stdout = '';
    let stderr = '';

    compileProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    compileProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    compileProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          type: 'build',
          action: 'compile',
          success: true,
          output: stdout,
          executable: outputPath,
        });
      } else {
        resolve({
          type: 'build',
          action: 'compile',
          success: false,
          output: stderr,
          error: true,
        });
      }
    });

    compileProcess.on('error', (error) => {
      resolve({
        type: 'build',
        action: 'compile',
        success: false,
        output: error.message,
        error: true,
      });
    });
  });
}

async function handleRun(filePath: string): Promise<any> {
  await fs.mkdir(SANDBOX_ROOT, { recursive: true }).catch(() => {
    // ignore mkdir errors
  });

  return new Promise((resolve) => {
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const executable = path.join(SANDBOX_ROOT, baseName);
    // On Windows, executables have .exe extension
    const executableExe = path.join(SANDBOX_ROOT, baseName + '.exe');

    // Try to find executable (with or without .exe on Windows)
    const checkExecutable = async () => {
      try {
        await fs.access(executable);
        return executable;
      } catch {
        try {
          await fs.access(executableExe);
          return executableExe;
        } catch {
          throw new Error('Executable not found');
        }
      }
    };

    checkExecutable()
      .then((exePath) => {
        const runProcess = spawn(exePath, [], {
          cwd: SANDBOX_ROOT,
          shell: process.platform === 'win32', // Use shell on Windows
        });

        let stdout = '';
        let stderr = '';

        runProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        runProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        runProcess.on('close', (code) => {
          resolve({
            type: 'build',
            action: 'run',
            success: code === 0,
            output: stdout,
            error: stderr,
            exitCode: code,
          });
        });

        runProcess.on('error', (error) => {
          resolve({
            type: 'build',
            action: 'run',
            success: false,
            output: '',
            error: error.message,
          });
        });
      })
      .catch(() => {
        resolve({
          type: 'build',
          action: 'run',
          success: false,
          output: '',
          error: 'Executable not found. Please compile first.',
        });
      });
  });
}

