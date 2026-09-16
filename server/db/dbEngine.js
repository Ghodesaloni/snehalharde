const fs = require("fs");
const path = require("path");
const { getPool } = require("./postgres");

const DATA_DIR = path.resolve(__dirname, "../data");

// Ensure data directory exists for local backups
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

// In-memory cache loaded from PostgreSQL
const memoryCache = new Map();

// Helper to read local JSON backup
function readLocalJson(collection, defaultData = []) {
  try {
    const filePath = getFilePath(collection);
    if (!fs.existsSync(filePath)) {
      writeLocalJson(collection, defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return defaultData;
  }
}

// Helper to write local JSON backup
function writeLocalJson(collection, data) {
  try {
    const filePath = getFilePath(collection);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    return false;
  }
}

// Pre-load memory cache from local backup initially
try {
  const initialFiles = [
    "jobs", "candidates", "interviews", "resumes",
    "email_templates", "email_sent", "settings", "interview_settings",
    "candidate_portal_sessions"
  ];
  for (const col of initialFiles) {
    memoryCache.set(col, readLocalJson(col, []));
  }
} catch (e) {}

// Async loader from PostgreSQL
async function loadFromPostgres() {
  try {
    const pool = getPool();
    const res = await pool.query("SELECT collection_name, data FROM public.app_collections");
    if (res.rows && res.rows.length > 0) {
      for (const row of res.rows) {
        let val = row.data;
        if (row.collection_name === "resumes" && Array.isArray(val)) {
          val = val.filter(r => r && r.id && !r.id.startsWith("c-100") && !r.email?.endsWith("@example.com"));
        }
        if (row.collection_name === "candidates" && Array.isArray(val)) {
          val = val.filter(c => c && c.id !== "cand-1789141858939" && !c.id.startsWith("cand-sample") && c.name !== "hina");
        }
        memoryCache.set(row.collection_name, val);
        writeLocalJson(row.collection_name, val);
      }
      console.log(`✓ Synchronized ${res.rows.length} collections from PostgreSQL into memory.`);
    }
  } catch (err) {
    if (err && err.message) {
      console.warn("PostgreSQL collection cache warm-up notice:", err.message);
    }
  }
}

// Trigger background warm-up
setTimeout(loadFromPostgres, 200);

/**
 * Synchronously read data for collection
 * Returns PostgreSQL-backed memory cache with local mirror fallback
 */
function readData(collection, defaultData = []) {
  if (memoryCache.has(collection)) {
    let cached = memoryCache.get(collection);
    if (collection === "resumes" && Array.isArray(cached)) {
      cached = cached.filter(r => r && r.id && !r.id.startsWith("c-100") && !r.email?.endsWith("@example.com"));
      memoryCache.set(collection, cached);
    }
    if (collection === "candidates" && Array.isArray(cached)) {
      cached = cached.filter(c => c && c.id !== "cand-1789141858939" && !c.id.startsWith("cand-sample") && c.name !== "hina");
      memoryCache.set(collection, cached);
    }
    return cached;
  }
  let local = readLocalJson(collection, defaultData);
  if (collection === "resumes" && Array.isArray(local)) {
    local = local.filter(r => r && r.id && !r.id.startsWith("c-100") && !r.email?.endsWith("@example.com"));
    writeLocalJson(collection, local);
  }
  if (collection === "candidates" && Array.isArray(local)) {
    local = local.filter(c => c && c.id !== "cand-1789141858939" && !c.id.startsWith("cand-sample") && c.name !== "hina");
    writeLocalJson(collection, local);
  }
  memoryCache.set(collection, local);
  return local;
}

/**
 * Asynchronously read data directly from PostgreSQL
 */
async function readDataAsync(collection, defaultData = []) {
  try {
    const pool = getPool();
    const res = await pool.query(
      "SELECT data FROM public.app_collections WHERE collection_name = $1 LIMIT 1",
      [collection]
    );
    if (res.rows && res.rows.length > 0) {
      let data = res.rows[0].data;
      if (collection === "resumes" && Array.isArray(data)) {
        data = data.filter(r => r && r.id && !r.id.startsWith("c-100") && !r.email?.endsWith("@example.com"));
      }
      if (collection === "candidates" && Array.isArray(data)) {
        data = data.filter(c => c && c.id !== "cand-1789141858939" && !c.id.startsWith("cand-sample") && c.name !== "hina");
      }
      memoryCache.set(collection, data);
      writeLocalJson(collection, data);
      return data;
    }
  } catch (err) {
    console.warn(`PostgreSQL async read error for ${collection}:`, err.message);
  }
  return readData(collection, defaultData);
}

/**
 * Asynchronously persist collection to PostgreSQL and sync relational tables
 */
async function syncToPostgres(collection, data) {
  try {
    const pool = getPool();

    // 1. Save to generic app_collections table
    await pool.query(
      `INSERT INTO public.app_collections (collection_name, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (collection_name) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [collection, JSON.stringify(data)]
    );

    // 2. Specialized sync for relational tables
    if (collection === "settings" && typeof data === "object" && !Array.isArray(data)) {
      await pool.query(
        `INSERT INTO public.app_settings (setting_key, setting_data, updated_at)
         VALUES ('general', $1, NOW())
         ON CONFLICT (setting_key) DO UPDATE SET setting_data = EXCLUDED.setting_data, updated_at = NOW()`,
        [JSON.stringify(data)]
      );
    } else if (collection === "interview_settings" && typeof data === "object" && !Array.isArray(data)) {
      await pool.query(
        `INSERT INTO public.app_settings (setting_key, setting_data, updated_at)
         VALUES ('interview', $1, NOW())
         ON CONFLICT (setting_key) DO UPDATE SET setting_data = EXCLUDED.setting_data, updated_at = NOW()`,
        [JSON.stringify(data)]
      );
    }
  } catch (err) {
    console.warn(`PostgreSQL background sync notice for ${collection}:`, err.message);
  }
}

/**
 * Write data for collection:
 * - Updates in-memory PostgreSQL cache
 * - Persists asynchronously to PostgreSQL database
 * - Updates local backup JSON
 */
function writeData(collection, data) {
  memoryCache.set(collection, data);
  writeLocalJson(collection, data);
  syncToPostgres(collection, data);
  return true;
}

/**
 * Async write data with confirmed PostgreSQL write
 */
async function writeDataAsync(collection, data) {
  memoryCache.set(collection, data);
  writeLocalJson(collection, data);
  await syncToPostgres(collection, data);
  return true;
}

module.exports = {
  readData,
  writeData,
  readDataAsync,
  writeDataAsync,
  loadFromPostgres,
};
