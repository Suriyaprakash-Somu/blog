import { Client } from "pg";

async function main() {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const allow = (process.env.ALLOW_DB_RESET ?? "").trim().toLowerCase();
  if (nodeEnv === "production" || (allow !== "true" && allow !== "1" && allow !== "yes")) {
    throw new Error("Refusing to reset DB. Set ALLOW_DB_RESET=true and ensure NODE_ENV is not production.");
  }

  const host = process.env.DATABASE_HOST ?? "localhost";
  const port = Number(process.env.DATABASE_PORT ?? "5432");
  const user = process.env.DATABASE_USER ?? "postgres";
  const password = process.env.DATABASE_PASSWORD ?? "";
  const database = process.env.DATABASE_NAME ?? "blog";

  const client = new Client({ host, port, user, password, database });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("DROP SCHEMA IF EXISTS public CASCADE");
    await client.query("CREATE SCHEMA public");
    await client.query(`GRANT ALL ON SCHEMA public TO ${user}`);
    await client.query("GRANT ALL ON SCHEMA public TO public");
    await client.query("COMMIT");
    console.log(`[db-reset] Reset schema public on ${host}:${port}/${database}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }

}

main().catch((err) => {
  console.error("[db-reset] FAILED", err);
  process.exit(1);
});
