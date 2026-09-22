import { PGlite } from "@electric-sql/pglite";
export async function testPool() {
  const db = new PGlite();
  await db.waitReady;
  let tail = Promise.resolve();
  async function lock() {
    let unlock;
    const p = new Promise((r) => (unlock = r)),
      previous = tail;
    tail = p;
    await previous;
    return unlock;
  }
  async function query(sql, args) {
    const r =
      !args && sql.includes(";")
        ? (await db.exec(sql)).at(-1)
        : await db.query(sql, args);
    return {
      rows: r?.rows || [],
      rowCount: r?.affectedRows || r?.rows?.length || 0,
    };
  }
  return {
    async query(sql, args) {
      const release = await lock();
      try {
        return await query(sql, args);
      } finally {
        release();
      }
    },
    async connect() {
      const release = await lock();
      return { query, release };
    },
    async end() {
      await db.close();
    },
  };
}
