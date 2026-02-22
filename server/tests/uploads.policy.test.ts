import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const childProcessMocks = vi.hoisted(() => {
  return {
    execFile: vi.fn(),
  };
});

vi.mock("node:child_process", () => {
  return {
    execFile: childProcessMocks.execFile,
  };
});

type ScanResult = { allowed: boolean; infected: boolean; lastError: string | null };

function withEnv(vars: Record<string, string | undefined>) {
  const prev = { ...process.env };
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
  return () => {
    process.env = prev;
  };
}

async function loadTestApi() {
  vi.resetModules();
  const mod = await import("../src/modules/uploads/uploads.route.js");
  return mod.__uploadsTest;
}

describe("uploads policy + scanning", () => {
  let restoreEnv: (() => void) | null = null;

  beforeEach(() => {
    restoreEnv?.();
    restoreEnv = withEnv({ NODE_ENV: "test" });
    childProcessMocks.execFile.mockReset();
  });

  afterEach(() => {
    restoreEnv?.();
    restoreEnv = null;
  });

  it("defaults to a safe allowlist when UPLOAD_ALLOWED_MIME is unset", async () => {
    restoreEnv?.();
    restoreEnv = withEnv({ NODE_ENV: "test", UPLOAD_ALLOWED_MIME: undefined });
    const api = await loadTestApi();

    const allowed = api.getAllowedMimeTypes();
    expect(allowed).not.toBeNull();
    expect(allowed?.has("image/jpeg")).toBe(true);
    expect(allowed?.has("application/pdf")).toBe(true);
    expect(allowed?.has("application/x-msdownload")).toBe(false);
  });

  it("treats UPLOAD_ALLOWED_MIME='*' as allow-any", async () => {
    restoreEnv?.();
    restoreEnv = withEnv({ NODE_ENV: "test", UPLOAD_ALLOWED_MIME: "*" });
    const api = await loadTestApi();

    const allowed = api.getAllowedMimeTypes();
    expect(allowed).toBeNull();
  });

  it("scanUpload is a no-op when UPLOAD_SCAN_MODE=none", async () => {
    restoreEnv?.();
    restoreEnv = withEnv({ NODE_ENV: "test", UPLOAD_SCAN_MODE: "none" });
    const api = await loadTestApi();

    const res: ScanResult = await api.scanUpload({ filePath: "C:/tmp/file.txt" });
    expect(res.allowed).toBe(true);
    expect(res.infected).toBe(false);
    expect(res.lastError).toBeNull();
    expect(childProcessMocks.execFile).not.toHaveBeenCalled();
  });

  it("scanUpload rejects infected files when ClamAV returns exit code 1", async () => {
    restoreEnv?.();
    restoreEnv = withEnv({
      NODE_ENV: "test",
      UPLOAD_SCAN_MODE: "clamav",
      UPLOAD_SCAN_COMMAND: "clamscan",
      UPLOAD_SCAN_TIMEOUT_MS: "1000",
      UPLOAD_SCAN_FAIL_CLOSED: "true",
    });

    childProcessMocks.execFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: { timeout: number }, cb: (err: unknown, out: string, errOut: string) => void) => {
        const e = new Error("infected") as Error & { code?: number };
        e.code = 1;
        cb(e, "stdin: Eicar-Test-Signature FOUND", "");
      },
    );

    const api = await loadTestApi();
    const res: ScanResult = await api.scanUpload({ filePath: "C:/tmp/eicar.txt" });
    expect(res.allowed).toBe(false);
    expect(res.infected).toBe(true);
    expect(res.lastError).toBe("File failed malware scan");
  });

  it("scanUpload fail-open allows upload on scanner error when UPLOAD_SCAN_FAIL_CLOSED=false", async () => {
    restoreEnv?.();
    restoreEnv = withEnv({
      NODE_ENV: "test",
      UPLOAD_SCAN_MODE: "clamav",
      UPLOAD_SCAN_COMMAND: "clamscan",
      UPLOAD_SCAN_TIMEOUT_MS: "1000",
      UPLOAD_SCAN_FAIL_CLOSED: "false",
    });

    childProcessMocks.execFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: { timeout: number }, cb: (err: unknown, out: string, errOut: string) => void) => {
        const e = new Error("scanner error") as Error & { code?: number };
        e.code = 2;
        cb(e, "", "db error");
      },
    );

    const api = await loadTestApi();
    const res: ScanResult = await api.scanUpload({ filePath: "C:/tmp/file.txt" });
    expect(res.allowed).toBe(true);
    expect(res.infected).toBe(false);
    expect(res.lastError).toContain("scanner error");
  });

  it("scanUpload fail-closed rejects upload on scanner error when UPLOAD_SCAN_FAIL_CLOSED=true", async () => {
    restoreEnv?.();
    restoreEnv = withEnv({
      NODE_ENV: "test",
      UPLOAD_SCAN_MODE: "clamav",
      UPLOAD_SCAN_COMMAND: "clamscan",
      UPLOAD_SCAN_TIMEOUT_MS: "1000",
      UPLOAD_SCAN_FAIL_CLOSED: "true",
    });

    childProcessMocks.execFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: { timeout: number }, cb: (err: unknown, out: string, errOut: string) => void) => {
        const e = new Error("scanner error") as Error & { code?: number };
        e.code = 2;
        cb(e, "", "db error");
      },
    );

    const api = await loadTestApi();
    const res: ScanResult = await api.scanUpload({ filePath: "C:/tmp/file.txt" });
    expect(res.allowed).toBe(false);
    expect(res.infected).toBe(false);
    expect(res.lastError).toContain("scanner error");
  });
});
