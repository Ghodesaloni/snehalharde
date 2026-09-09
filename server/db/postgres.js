const { Pool } = require("pg");

let pool = null;

function getPool() {
  if (!pool && process.env.SQL_HOST) {
    pool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) return null;
  return await p.query(text, params);
}

module.exports = {
  getPool,
  query,
};
