import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { InternalServerError } from "@/shared/errors";

/** Common install locations across platforms — checked in order, first existing wins. */
const SOFFICE_CANDIDATES = [
  process.env.SOFFICE_PATH,
  "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  "/usr/bin/soffice",
  "/usr/local/bin/soffice",
  "soffice",
].filter((candidate): candidate is string => Boolean(candidate));

async function resolveSofficeBinary(): Promise<string> {
  for (const candidate of SOFFICE_CANDIDATES) {
    if (!candidate.startsWith("/")) {
      // Bare command name — let the OS resolve it against PATH; verified by the actual spawn attempt below.
      return candidate;
    }
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return "soffice";
}

/**
 * Converts a filled .xlsx buffer to PDF via LibreOffice headless — the only
 * way to get a pixel-faithful Excel→PDF conversion (same merges/borders/page
 * setup) without Microsoft Office. Requires the `soffice` binary to be
 * installed on whatever machine runs this; throws a clear, actionable error
 * if it can't be found rather than failing with a cryptic ENOENT.
 */
export async function convertWorkbookToPdf(xlsxBuffer: Buffer): Promise<Buffer> {
  const soffice = await resolveSofficeBinary();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pamaina-schedule-export-"));
  const inputPath = path.join(tmpDir, `${randomUUID()}.xlsx`);
  const expectedOutputPath = inputPath.replace(/\.xlsx$/, ".pdf");

  try {
    await fs.writeFile(inputPath, xlsxBuffer);

    await new Promise<void>((resolve, reject) => {
      const child = spawn(soffice, ["--headless", "--norestore", "--convert-to", "pdf", "--outdir", tmpDir, inputPath]);

      let stderr = "";
      child.stderr?.on("data", (data) => {
        stderr += String(data);
      });

      child.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") {
          reject(
            new InternalServerError(
              "LibreOffice ('soffice') was not found on this machine. Install LibreOffice to enable PDF/print export (set SOFFICE_PATH if it's installed in a non-standard location).",
            ),
          );
          return;
        }
        reject(new InternalServerError(`Failed to start LibreOffice for PDF conversion: ${error.message}`));
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new InternalServerError(`LibreOffice PDF conversion failed (exit code ${code}): ${stderr.trim()}`));
        }
      });
    });

    return await fs.readFile(expectedOutputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
