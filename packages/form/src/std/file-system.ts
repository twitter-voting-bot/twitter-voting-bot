import fs from 'fs';
import path from 'path';

/**
 * This will create a default interface for the fileSystem api so we do not need to interact with it directly, useful for serverless.
 * Since we might want to change runtimes, we can create a new file-system.ts file in the new runtime and export the same interface.
 */
const fileSystem = {
  join: (...paths: string[]): string => {
    return path.join(...paths);
  },
  resolvePath: (...paths: string[]): string => {
    return path.resolve(...paths);
  },
  read: (
    filePath: string
  ): Promise<{
    buffer: Buffer;
    text: string;
  }> => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (error, data) => {
        if (error) reject(error);
        else {
          const isABuffer = data instanceof Buffer;
          resolve({
            buffer: isABuffer ? data : Buffer.from(data),
            text: isABuffer ? data.toString() : data,
          });
        }
      });
    });
  },
  write: (filePath: string, data: string | Buffer): Promise<void> => {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, data, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  },
  exists: (path: string | string[]): Promise<boolean> => {
    const pathToUse = Array.isArray(path) ? fileSystem.join(...path) : path;

    return new Promise((resolve, reject) => {
      fs.access(pathToUse, fs.constants.F_OK, (error) => {
        if (error) {
          if (error.code === 'ENOENT') resolve(false);
          else reject(error);
        } else resolve(true);
      });
    });
  },
};

export default fileSystem;
