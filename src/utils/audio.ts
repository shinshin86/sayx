import { fileTypeFromBuffer } from "file-type";

export async function detectExtension(buffer: Buffer): Promise<string> {
  try {
    const type = await fileTypeFromBuffer(buffer);
    if (type?.ext) {
      return type.ext;
    }
  } catch {
    // Ignore detection errors
  }
  return "wav";
}
