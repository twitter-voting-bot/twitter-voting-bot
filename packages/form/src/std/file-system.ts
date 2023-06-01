import fs from 'fs';
import path from 'path';
/**
 * This will create a default interface for the fileSystem api so we do not need to interact with it directly, useful for serverless.
 * Since we might want to change runtimes, we can create a new file-system.ts file in the new runtime and export the same interface.
 */
const fileSystem = {
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
};

export default fileSystem;
