import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import playSound from "play-sound";
import { detectExtension } from "./utils/audio.js";

const player = playSound({});

export interface PlayResult {
  tempPath: string;
  extension: string;
  played: boolean;
  error?: string;
}

function playAudioFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    player.play(filePath, (err: Error | null) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function playAudio(
  audioBuffer: ArrayBuffer,
  options: {
    outPath?: string;
    shouldPlay: boolean;
  }
): Promise<PlayResult> {
  const buffer = Buffer.from(audioBuffer);
  const extension = await detectExtension(buffer);
  const tempFileName = `sayx-${randomUUID()}.${extension}`;
  const tempPath = path.join(os.tmpdir(), tempFileName);

  // Write to temp file
  fs.writeFileSync(tempPath, buffer);

  // Copy to output path if specified
  if (options.outPath) {
    const outDir = path.dirname(options.outPath);
    if (outDir && !fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // If output path has no extension, append detected extension
    let finalOutPath = options.outPath;
    if (!path.extname(options.outPath)) {
      finalOutPath = `${options.outPath}.${extension}`;
    }

    fs.copyFileSync(tempPath, finalOutPath);
    console.log(`Audio saved to: ${finalOutPath}`);
  }

  // Play if requested
  if (options.shouldPlay) {
    try {
      await playAudioFile(tempPath);
      // Clean up temp file after successful playback
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      return { tempPath, extension, played: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Keep temp file on playback failure
      return {
        tempPath,
        extension,
        played: false,
        error: `Playback failed: ${message}\nAudio file saved at: ${tempPath}`,
      };
    }
  }

  // Not playing, clean up temp file if we also saved to outPath
  if (options.outPath) {
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }

  return { tempPath, extension, played: false };
}
