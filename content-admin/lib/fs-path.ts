import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

/** Avoid Turbopack tracing the whole repo when joining runtime directory paths. */
export function joinContentPath(...parts: string[]): string {
  return path.join(/* turbopackIgnore: true */ ...parts);
}

export function resolveContentPath(...parts: string[]): string {
  return path.resolve(/* turbopackIgnore: true */ ...parts);
}

export function contentPathExists(filePath: string): boolean {
  return fs.existsSync(/* turbopackIgnore: true */ filePath);
}

export async function readContentFile(filePath: string): Promise<string> {
  return fsPromises.readFile(/* turbopackIgnore: true */ filePath, "utf8");
}

export async function writeContentFile(filePath: string, data: string): Promise<void> {
  await fsPromises.writeFile(/* turbopackIgnore: true */ filePath, data, "utf8");
}

export async function renameContentFile(from: string, to: string): Promise<void> {
  await fsPromises.rename(/* turbopackIgnore: true */ from, to);
}

export function readContentFileSync(filePath: string): string {
  return fs.readFileSync(/* turbopackIgnore: true */ filePath, "utf8");
}

export async function accessContentPath(filePath: string): Promise<void> {
  await fsPromises.access(/* turbopackIgnore: true */ filePath);
}
