import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { FastifyPluginAsync } from "fastify";
import { env } from "../../../common/env.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";

const execAsync = promisify(exec);

export const platformSystemRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes require platform admin auth
  fastify.addHook("preHandler", requirePlatformAuth());
  fastify.addHook("preHandler", platformAbilityGuard("manage", "all"));

  /**
   * POST /backup
   * Runs the backup script and streams the generated .dump file
   */
  fastify.post("/backup", async (request, reply) => {
    const {
      DATABASE_USER,
      DATABASE_PASSWORD,
      DATABASE_HOST,
      DATABASE_PORT,
      DATABASE_NAME,
    } = env;

    // Construct DATABASE_URL for the script
    const databaseUrl = `postgres://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;
    const scriptsDir = path.resolve(process.cwd(), "scripts");
    const backupsDir = path.resolve(process.cwd(), "backups");

    try {
      fastify.log.info("[System] Starting database backup...");
      
      // Execute backup script
      const { stdout, stderr } = await execAsync("sh ./scripts/backup-postgres.sh", {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        cwd: process.cwd(),
      });

      if (stderr) fastify.log.warn(`[System] Backup script stderr: ${stderr}`);
      fastify.log.info(`[System] Backup script output: ${stdout}`);

      // Find the latest file in backups/
      const files = await fs.readdir(backupsDir);
      const dumpFiles = files
        .filter((f) => f.startsWith("indiancontext_") && f.endsWith(".dump"))
        .sort()
        .reverse();

      if (dumpFiles.length === 0) {
        throw new Error("Backup file not found after script execution");
      }

      const latestFile = dumpFiles[0];
      const filePath = path.join(backupsDir, latestFile);

      // Stream the file for download
      const stream = (await import("node:fs")).createReadStream(filePath);
      
      reply.header("Content-Type", "application/octet-stream");
      reply.header("Content-Disposition", `attachment; filename="${latestFile}"`);

      // Cleanup: Delete the file after it has been sent
      stream.on("close", () => {
        fs.unlink(filePath).catch((err) => 
          fastify.log.error(`[System] Failed to delete temporary backup file: ${err.message}`)
        );
      });

      return reply.send(stream);
    } catch (error) {
      fastify.log.error({ err: error }, "[System] Backup failed");
      return reply.status(500).send({ 
        error: "Backup failed", 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  /**
   * POST /restore
   * Receives a .dump file and runs the restore script
   */
  fastify.post("/restore", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: "No file provided" });
    }

    if (!data.filename.endsWith(".dump")) {
      return reply.status(400).send({ error: "Invalid file type. Expected .dump file." });
    }

    const tmpPath = path.resolve(process.cwd(), "backups", `restore_${Date.now()}.dump`);
    
    // Ensure backups dir exists
    await fs.mkdir(path.dirname(tmpPath), { recursive: true });

    try {
      // Save file to temp location
      const { pipeline } = await import("node:stream/promises");
      const writeStream = (await import("node:fs")).createWriteStream(tmpPath);
      await pipeline(data.file, writeStream);

      fastify.log.info("[System] Starting database restore...");
      
      const {
        DATABASE_USER,
        DATABASE_PASSWORD,
        DATABASE_HOST,
        DATABASE_PORT,
        DATABASE_NAME,
      } = env;

      const databaseUrl = `postgres://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;

      // Execute restore script
      const { stdout, stderr } = await execAsync(`sh ./scripts/restore-postgres.sh "${tmpPath}"`, {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        cwd: process.cwd(),
      });

      if (stderr) fastify.log.warn(`[System] Restore script stderr: ${stderr}`);
      fastify.log.info(`[System] Restore script output: ${stdout}`);

      // Cleanup
      await fs.unlink(tmpPath);

      return reply.send({ ok: true, message: "Database restored successfully" });
    } catch (error) {
      // Cleanup on error if file exists
      try { await fs.unlink(tmpPath); } catch { /* ignore */ }

      fastify.log.error({ err: error }, "[System] Restore failed");
      return reply.status(500).send({ 
        error: "Restore failed", 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });
};
