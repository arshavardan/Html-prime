import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs-extra';
import multer from 'multer';
import { isTestEnv } from './test';

const diskStorage = (folder: string) => {
  const baseDir = isTestEnv() ? path.join(__dirname, '../../../dist') : __dirname;
  fs.mkdirs(path.join(baseDir, `/uploads/${folder}`));
  return multer.diskStorage({
    destination: (_: express.Request, __: Express.Multer.File, cb) => cb(null, path.join(baseDir, `/uploads/${folder}`)),
    filename: (_: express.Request, file: Express.Multer.File, cb) => {
      crypto.pseudoRandomBytes(16, (_, raw) => cb(null, `${raw.toString('hex')}${Date.now()}${path.extname(file.originalname)}`));
    },
  });
};

const cleanUp = (files: string[]) => {
  const baseDir = isTestEnv() ? path.join(__dirname, '../../../dist/uploads') : path.join(__dirname, 'uploads');
  files.forEach(async (file) => {
    const filePath = path.join(baseDir, file);
    const stat = await fs.stat(filePath);

    // security: adding the following conditional checks to avoid accidental or malicious deletion of files
    // 1. Don't allow relative file path starting with . or ..
    // 2. Check if filePath startsWith baseDir
    // 3. Check if the path we are deleting is an actual file and not a directory
    if (!file.startsWith('.') && !file.startsWith('..') && filePath.startsWith(baseDir) && stat.isFile()) {
      await fs.remove(filePath);
    }
  });
};

export default { diskStorage, cleanUp };
