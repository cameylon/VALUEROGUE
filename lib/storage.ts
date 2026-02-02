import fs from "fs";
import path from "path";

export type StorageProvider = {
  saveFile: (relativePath: string, buffer: Buffer) => Promise<string>;
};

export class LocalStorageProvider implements StorageProvider {
  async saveFile(relativePath: string, buffer: Buffer) {
    const baseDir = path.join(process.cwd(), "storage");
    const fullPath = path.join(baseDir, relativePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
    return fullPath;
  }
}

export function getStorageProvider() {
  return new LocalStorageProvider();
}
