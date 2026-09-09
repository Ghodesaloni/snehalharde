const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { query } = require("../db/postgres");

// Password hashing helpers using Node.js crypto
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  // Fallback for plain text if any
  if (!storedHash.includes(":")) {
    return password === storedHash;
  }
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

// GET /api/users/demo-accounts - get quick reference demo HR accounts
router.get("/demo-accounts", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        email: "hr@avahire.ai",
        password: "password123",
        role: "Lead HR Administrator",
        name: "Priya Mehta",
        company: "TechCorp Solutions Pvt. Ltd.",
      },
      {
        email: "admin@avahire.ai",
        password: "password123",
        role: "Director of People Ops",
        name: "AvaHire Admin",
        company: "AvaHire Talent Intelligence",
      },
    ],
  });
});

// GET /api/users - list users from PostgreSQL
router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, uid, email, name, avatar, role, company, designation, phone, last_login, created_at FROM users ORDER BY id ASC"
    );
    if (result && result.rows) {
      return res.json({ success: true, count: result.rows.length, data: result.rows });
    }
    return res.json({ success: true, count: 0, data: [] });
  } catch (err) {
    console.error("Error fetching users from PostgreSQL:", err);
    res.status(500).json({ success: false, error: "Database query failed. Please try again later." });
  }
});

// GET /api/users/me - get current user profile
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized: Missing token" });
    }
    const token = authHeader.split(" ")[1]?.trim();
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized: Invalid token" });
    }

    // Try finding by uid or email
    const result = await query(
      "SELECT id, uid, email, name, avatar, role, company, designation, phone, last_login, created_at FROM users WHERE uid = $1 OR email = $1 LIMIT 1",
      [token]
    );

    if (result && result.rows && result.rows.length > 0) {
      return res.json({ success: true, data: result.rows[0] });
    }

    return res.status(404).json({ success: false, error: "User session not found in database" });
  } catch (err) {
    console.error("Error retrieving user profile from PostgreSQL:", err);
    res.status(500).json({ success: false, error: "Failed to fetch user profile" });
  }
});

// POST /api/users/login - authenticate user via PostgreSQL
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Work email is required" });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: "Password is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await query(
      "SELECT id, uid, email, name, avatar, role, company, designation, phone, password_hash FROM users WHERE LOWER(email) = $1 LIMIT 1",
      [cleanEmail]
    );

    if (!existing || !existing.rows || existing.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "No HR account found with this email. Please check your credentials or register a new account.",
      });
    }

    const user = existing.rows[0];

    // Verify password against PostgreSQL hash
    if (user.password_hash) {
      const isMatch = verifyPassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: "Incorrect password. Please check your credentials.",
        });
      }
    } else {
      // First-time set password if user was seeded without hash
      const newHash = hashPassword(password);
      await query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, user.id]);
    }

    // Update last_login timestamp in PostgreSQL
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const sessionUser = {
      id: user.id,
      uid: user.uid,
      email: user.email,
      name: user.name || cleanEmail.split("@")[0],
      avatar: user.avatar,
      role: user.role || "recruiter",
      company: user.company || "AvaHire Tech Solutions",
      designation: user.designation || "HR Administrator",
      phone: user.phone,
    };

    const token = user.uid;

    res.json({
      success: true,
      data: sessionUser,
      token,
      message: `Welcome back, ${sessionUser.name}!`,
    });
  } catch (err) {
    console.error("Error logging in via PostgreSQL:", err);
    res.status(500).json({ success: false, error: "PostgreSQL authentication query failed" });
  }
});

// POST /api/users/register - register new HR user in PostgreSQL
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, name, company, designation, phone, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await query("SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1", [cleanEmail]);
    if (existing && existing.rows && existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "An account with this work email already exists. Please log in instead.",
      });
    }

    const uid = "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const displayName = (fullName || name || cleanEmail.split("@")[0]).trim();
    const userRole = role || "hr_admin";
    const userCompany = company || "TechCorp Solutions";
    const userDesignation = designation || "HR Manager";
    const userPhone = phone || "+91 98000 00000";
    const hashedPassword = hashPassword(password);

    const sql = `
      INSERT INTO users (uid, email, name, role, company, designation, phone, password_hash, last_login)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, uid, email, name, role, company, designation, phone, created_at;
    `;
    const result = await query(sql, [
      uid,
      cleanEmail,
      displayName,
      userRole,
      userCompany,
      userDesignation,
      userPhone,
      hashedPassword,
    ]);

    const createdUser = result?.rows?.[0];
    res.status(201).json({
      success: true,
      data: createdUser,
      token: uid,
      message: "HR Account registered successfully in PostgreSQL!",
    });
  } catch (err) {
    console.error("Error registering user in PostgreSQL:", err);
    res.status(500).json({ success: false, error: "PostgreSQL account creation failed" });
  }
});

module.exports = router;
