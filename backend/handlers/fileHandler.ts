import * as path from 'path';
import * as fs from 'fs/promises';

const GENIX_ROOT = path.resolve(process.cwd(), 'GenixFiles');

// Ensure GenixFiles directory structure exists
async function ensureGenixStructure() {
  try {
    await fs.mkdir(GENIX_ROOT, { recursive: true });
    await fs.mkdir(path.join(GENIX_ROOT, 'notes'), { recursive: true });
    await fs.mkdir(path.join(GENIX_ROOT, 'documents'), { recursive: true });
    await fs.mkdir(path.join(GENIX_ROOT, 'projects'), { recursive: true });
  } catch (error) {
    console.error('Error creating GenixFiles structure:', error);
  }
}

// Initialize on module load
ensureGenixStructure();

interface FileMessage {
  type: 'file';
  action: 'read' | 'write' | 'create' | 'delete' | 'list';
  path?: string;
  content?: string;
}

export async function handleFile(data: FileMessage): Promise<any> {
  const { action, path: filePath, content } = data;

  // For 'list' action, if path is '.' or empty, use root
  const resolvedPath = !filePath || filePath === '.' ? '' : filePath;
  const fullPath = path.resolve(GENIX_ROOT, resolvedPath);
  
  // Security check
  if (!fullPath.startsWith(GENIX_ROOT)) {
    return { type: 'error', message: 'Permission denied: Path outside GenixFiles root' };
  }

  try {
    switch (action) {
      case 'read':
        const fileContent = await fs.readFile(fullPath, 'utf-8');
        return { type: 'file', action: 'read', path: filePath, content: fileContent };
      
      case 'write':
        // Ensure parent directory exists
        const writeDir = path.dirname(fullPath);
        await fs.mkdir(writeDir, { recursive: true });
        await fs.writeFile(fullPath, content || '', 'utf-8');
        return { type: 'file', action: 'write', path: filePath, success: true };
      
      case 'create':
        // Ensure parent directory exists
        const createDir = path.dirname(fullPath);
        await fs.mkdir(createDir, { recursive: true });
        await fs.writeFile(fullPath, content || '', 'utf-8');
        return { type: 'file', action: 'create', path: filePath, success: true };
      
      case 'delete':
        await fs.unlink(fullPath);
        return { type: 'file', action: 'delete', path: filePath, success: true };
      
      case 'list':
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        const items = entries.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
        }));
        return { type: 'file', action: 'list', path: resolvedPath || '.', items };
      
      default:
        return { type: 'error', message: 'Unknown file action' };
    }
  } catch (error) {
    return {
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

