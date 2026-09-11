const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Read configuration from environment
const sqlHost = process.env.SQL_HOST || process.env.PGHOST || "localhost";
const sqlPort = parseInt(process.env.SQL_PORT || process.env.PGPORT || "5432", 10);
const sqlDb = process.env.SQL_DB_NAME || process.env.PGDATABASE || "avahire_db";
const sqlUser = process.env.SQL_USER || process.env.PGUSER || "postgres";
const sqlPassword = process.env.SQL_PASSWORD || process.env.PGPASSWORD || "";
const databaseUrl = process.env.DATABASE_URL;

// Normalize DATABASE_URL and strip accidental bracket wrappers if entered from template [PASSWORD]
function getCleanDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    let pw = decodeURIComponent(u.password);
    if (pw.startsWith("[") && pw.endsWith("]")) {
      pw = pw.slice(1, -1);
    }
    return `${u.protocol}//${u.username}:${encodeURIComponent(pw)}@${u.host}${u.pathname}`;
  } catch {
    return rawUrl;
  }
}

// Local file-based fallback database for offline/development resilience
const DATA_DIR = path.resolve(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // Ignore error if already exists
  }
}

const USERS_FILE = path.join(DATA_DIR, "postgres_users_mirror.json");
const TOKENS_FILE = path.join(DATA_DIR, "postgres_verification_tokens_mirror.json");

function readJson(file) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
  return [];
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

let pool = null;
let pgConnected = false;

// Create pool lazily
function getPool() {
  if (!pool) {
    const cleanUrl = getCleanDatabaseUrl();
    const isCloudPostgres = Boolean(
      cleanUrl && (
        cleanUrl.includes("supabase.co") ||
        cleanUrl.includes("supabase.com") ||
        cleanUrl.includes("neon.tech") ||
        cleanUrl.includes("sslmode=require") ||
        !cleanUrl.includes("localhost")
      )
    );

    const poolConfig = cleanUrl
      ? {
          connectionString: cleanUrl,
          ssl: isCloudPostgres ? { rejectUnauthorized: false } : undefined,
          max: 10,
          connectionTimeoutMillis: 8000,
        }
      : {
          host: sqlHost,
          port: sqlPort,
          database: sqlDb,
          user: sqlUser,
          password: sqlPassword,
          max: 10,
          connectionTimeoutMillis: 5000,
        };

    pool = new Pool(poolConfig);

    pool.on("error", (err) => {
      console.warn("PostgreSQL pool idle client warning:", err.message);
    });
  }
  return pool;
}

// Initialize tables in PostgreSQL
async function initTables() {
  const p = getPool();
  try {
    const client = await p.connect();
    try {
      // 1. Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255),
          company VARCHAR(255),
          website VARCHAR(255),
          designation VARCHAR(255),
          phone VARCHAR(100),
          is_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Verification tokens table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.verification_tokens (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes for faster token lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.verification_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON public.verification_tokens(email);
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
      `);

      // Sync any registered mirror users to PostgreSQL public.users
      try {
        const localUsers = readJson(USERS_FILE);
        for (const u of localUsers) {
          if (u && u.email) {
            const pw = u.passwordHash || u.password_hash || null;
            await client.query(`
              INSERT INTO public.users (email, full_name, password_hash, company, website, designation, phone, is_verified)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (email) DO UPDATE
              SET password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash),
                  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
            `, [
              u.email.toLowerCase(),
              u.fullName || u.name || "",
              pw,
              u.company || "",
              u.website || "",
              u.designation || "",
              u.phone || "",
              Boolean(u.isVerified),
            ]);
          }
        }
      } catch (syncErr) {
        console.warn("PostgreSQL user sync notice:", syncErr.message);
      }

      pgConnected = true;
      console.log("✓ PostgreSQL connected: 'public.users' and 'public.verification_tokens' tables verified.");
    } finally {
      client.release();
    }
  } catch (err) {
    pgConnected = false;
    console.warn("Notice: PostgreSQL live connection currently unavailable (" + err.message + "). Dual-layer persistence active.");
  }
}

// Immediately attempt non-blocking table verification
initTables().catch((err) => {
  console.warn("Initial PostgreSQL connection attempt:", err.message);
});

// Save or update user
async function saveUser(userData) {
  const { email, fullName, passwordHash, company, website, designation, phone, isVerified } = userData;

  // Always persist to local mirror for full availability
  const usersList = readJson(USERS_FILE);
  const existingIdx = usersList.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  const now = new Date().toISOString();

  let userRecord;
  if (existingIdx >= 0) {
    userRecord = {
      ...usersList[existingIdx],
      fullName: fullName || usersList[existingIdx].fullName,
      company: company !== undefined ? company : usersList[existingIdx].company,
      website: website !== undefined ? website : usersList[existingIdx].website,
      designation: designation !== undefined ? designation : usersList[existingIdx].designation,
      phone: phone !== undefined ? phone : usersList[existingIdx].phone,
      passwordHash: passwordHash || usersList[existingIdx].passwordHash,
      isVerified: isVerified !== undefined ? Boolean(isVerified) : Boolean(usersList[existingIdx].isVerified),
      updatedAt: now,
    };
    usersList[existingIdx] = userRecord;
  } else {
    userRecord = {
      id: usersList.length + 1,
      email: email.toLowerCase(),
      fullName: fullName || email.split("@")[0],
      passwordHash,
      company: company || "",
      website: website || "",
      designation: designation || "",
      phone: phone || "",
      isVerified: isVerified !== undefined ? Boolean(isVerified) : false,
      createdAt: now,
      updatedAt: now,
    };
    usersList.push(userRecord);
  }
  writeJson(USERS_FILE, usersList);

  // Persist to PostgreSQL if available
  try {
    const p = getPool();
    const query = `
      INSERT INTO users (email, full_name, password_hash, company, website, designation, phone, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash),
          company = EXCLUDED.company,
          website = EXCLUDED.website,
          designation = EXCLUDED.designation,
          phone = EXCLUDED.phone,
          is_verified = COALESCE(EXCLUDED.is_verified, public.users.is_verified),
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, full_name, company, designation, is_verified, created_at;
    `;
    const res = await p.query(query, [
      email.toLowerCase(),
      fullName || email.split("@")[0],
      passwordHash || null,
      company || "",
      website || "",
      designation || "",
      phone || "",
      userRecord.isVerified,
    ]);
    if (res.rows && res.rows[0]) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn("PostgreSQL user save fallback:", err.message);
  }

  return userRecord;
}

// Reset password for an account
async function resetPassword(email, newPassword) {
  if (!email || !newPassword) return false;
  const crypto = require("crypto");
  const cleanEmail = email.trim().toLowerCase();
  const passwordHash = crypto.createHash("sha256").update(newPassword).digest("hex");
  const now = new Date().toISOString();

  const usersList = readJson(USERS_FILE);
  const idx = usersList.findIndex((u) => u.email?.toLowerCase() === cleanEmail);
  if (idx >= 0) {
    usersList[idx].passwordHash = passwordHash;
    usersList[idx].isVerified = true;
    usersList[idx].updatedAt = now;
    writeJson(USERS_FILE, usersList);
  } else {
    usersList.push({
      id: usersList.length + 1,
      email: cleanEmail,
      fullName: cleanEmail.split("@")[0],
      passwordHash,
      company: "AvaHire Tech",
      website: "",
      designation: "HR Manager",
      phone: "",
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    writeJson(USERS_FILE, usersList);
  }

  try {
    const p = getPool();
    if (p) {
      await p.query(
        `UPDATE public.users SET password_hash = $1, is_verified = TRUE, updated_at = NOW() WHERE LOWER(email) = $2`,
        [passwordHash, cleanEmail]
      );
    }
  } catch (err) {
    console.warn("PostgreSQL resetPassword fallback:", err.message);
  }
  return true;
}

// Save one-time verification token
async function saveVerificationToken({ email, token, expiresAt }) {
  const now = new Date().toISOString();
  const tokenObj = {
    id: Date.now(),
    email: email.toLowerCase(),
    token,
    expiresAt: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
    used: false,
    usedAt: null,
    createdAt: now,
  };

  // 1. Local mirror
  const tokens = readJson(TOKENS_FILE);
  tokens.push(tokenObj);
  writeJson(TOKENS_FILE, tokens);

  // 2. PostgreSQL
  try {
    const p = getPool();
    const query = `
      INSERT INTO verification_tokens (email, token, expires_at, used, created_at)
      VALUES ($1, $2, $3, FALSE, CURRENT_TIMESTAMP)
      RETURNING id, email, token, expires_at, used, created_at;
    `;
    const res = await p.query(query, [
      email.toLowerCase(),
      token,
      expiresAt instanceof Date ? expiresAt : new Date(expiresAt),
    ]);
    if (res.rows && res.rows[0]) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn("PostgreSQL token save fallback:", err.message);
  }

  return tokenObj;
}

// Find verification token
async function findVerificationToken(token) {
  // 1. Try PostgreSQL first
  try {
    const p = getPool();
    const res = await p.query(
      `SELECT * FROM verification_tokens WHERE token = $1 ORDER BY id DESC LIMIT 1`,
      [token]
    );
    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: row.id,
        email: row.email,
        token: row.token,
        expiresAt: row.expires_at,
        used: row.used,
        usedAt: row.used_at,
        createdAt: row.created_at,
      };
    }
  } catch (err) {
    console.warn("PostgreSQL token lookup fallback:", err.message);
  }

  // 2. Fallback to local mirror
  const tokens = readJson(TOKENS_FILE);
  return tokens.find((t) => t.token === token) || null;
}

// Consume one-time token and verify user
async function consumeVerificationToken(token) {
  const tokenRecord = await findVerificationToken(token);
  if (!tokenRecord) {
    return { success: false, reason: "NOT_FOUND" };
  }

  if (tokenRecord.used) {
    return { success: false, reason: "ALREADY_USED", email: tokenRecord.email };
  }

  const expiry = new Date(tokenRecord.expiresAt);
  if (expiry < new Date()) {
    return { success: false, reason: "EXPIRED", email: tokenRecord.email };
  }

  const now = new Date();

  // Mark token used in PostgreSQL
  try {
    const p = getPool();
    await p.query(
      `UPDATE verification_tokens SET used = TRUE, used_at = $1 WHERE token = $2`,
      [now, token]
    );
    await p.query(
      `UPDATE users SET is_verified = TRUE, updated_at = $1 WHERE email = $2`,
      [now, tokenRecord.email.toLowerCase()]
    );
  } catch (err) {
    console.warn("PostgreSQL consume token fallback:", err.message);
  }

  // Update in local mirror
  const tokens = readJson(TOKENS_FILE);
  const tIdx = tokens.findIndex((t) => t.token === token);
  if (tIdx >= 0) {
    tokens[tIdx].used = true;
    tokens[tIdx].usedAt = now.toISOString();
    writeJson(TOKENS_FILE, tokens);
  }

  const usersList = readJson(USERS_FILE);
  const uIdx = usersList.findIndex((u) => u.email.toLowerCase() === tokenRecord.email.toLowerCase());
  if (uIdx >= 0) {
    usersList[uIdx].isVerified = true;
    usersList[uIdx].updatedAt = now.toISOString();
    writeJson(USERS_FILE, usersList);
  }

  return { success: true, email: tokenRecord.email };
}

// Get user by email
async function getUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  try {
    const p = getPool();
    if (p) {
      const res = await p.query(
        `SELECT id, email, full_name, password_hash, company, website, designation, phone, is_verified, created_at FROM public.users WHERE LOWER(email) = $1 LIMIT 1`,
        [cleanEmail]
      );
      if (res.rows && res.rows[0]) {
        const row = res.rows[0];
        return {
          id: row.id,
          uid: `usr_${row.id}`,
          email: row.email,
          fullName: row.full_name,
          name: row.full_name,
          company: row.company,
          website: row.website,
          designation: row.designation,
          phone: row.phone,
          password_hash: row.password_hash,
          passwordHash: row.password_hash,
          isVerified: row.is_verified,
          createdAt: row.created_at,
        };
      }
    }
  } catch (err) {
    console.warn("PostgreSQL getUserByEmail fallback:", err.message);
  }

  const usersList = readJson(USERS_FILE);
  const found = usersList.find((u) => u.email?.toLowerCase() === cleanEmail);
  if (found) {
    return {
      id: found.id,
      uid: `usr_${found.id}`,
      email: found.email,
      fullName: found.fullName || found.name || "",
      name: found.fullName || found.name || "",
      company: found.company || "",
      website: found.website || "",
      designation: found.designation || "",
      phone: found.phone || "",
      password_hash: found.passwordHash || found.password_hash || null,
      passwordHash: found.passwordHash || found.password_hash || null,
      isVerified: Boolean(found.isVerified),
      createdAt: found.createdAt,
    };
  }

  // Also check default users store
  const defaultUsersFile = path.join(DATA_DIR, "users.json");
  const fallbackUsers = readJson(defaultUsersFile);
  const fallbackFound = fallbackUsers.find((u) => u.email?.toLowerCase() === cleanEmail);
  if (fallbackFound) {
    return {
      id: fallbackFound.id,
      uid: fallbackFound.uid || `usr_${fallbackFound.id}`,
      email: fallbackFound.email,
      fullName: fallbackFound.name,
      name: fallbackFound.name,
      company: fallbackFound.company || "AvaHire",
      website: "",
      designation: fallbackFound.designation || "HR Administrator",
      phone: fallbackFound.phone || "+91 98000 00000",
      password_hash: fallbackFound.password_hash || "password123",
      passwordHash: fallbackFound.password_hash || "password123",
      isVerified: true,
      createdAt: fallbackFound.created_at,
    };
  }

  return null;
}

// Generic query runner
async function query(text, params) {
  try {
    const p = getPool();
    if (!p) {
      return { rows: [] };
    }
    return await p.query(text, params);
  } catch (err) {
    console.warn("PostgreSQL query fallback:", err.message);
    return { rows: [] };
  }
}

module.exports = {
  getPool,
  initTables,
  saveUser,
  resetPassword,
  saveVerificationToken,
  findVerificationToken,
  consumeVerificationToken,
  getUserByEmail,
  query,
};
