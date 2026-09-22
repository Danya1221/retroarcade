import { readFile, readdir } from "node:fs/promises";
import { pool, transaction } from "./db.js";
import { fileURLToPath } from "node:url";
export async function migrate() {
  await transaction(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(918271)");
    await c.query(
      "CREATE TABLE IF NOT EXISTS migrations(name text PRIMARY KEY,applied_at timestamptz DEFAULT now())",
    );
    for (const name of (await readdir(new URL(".", import.meta.url)))
      .filter((x) => x.endsWith(".sql"))
      .sort()) {
      if (
        (await c.query("SELECT 1 FROM migrations WHERE name=$1", [name]))
          .rowCount
      )
        continue;
      await c.query(await readFile(new URL(name, import.meta.url), "utf8"));
      await c.query("INSERT INTO migrations(name) VALUES($1)", [name]);
    }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await migrate();
  await pool.end();
  console.log("Migrations complete");
}
