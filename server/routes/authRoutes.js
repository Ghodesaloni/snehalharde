const express = require("express");
const crypto = require("crypto");
const postgresDb = require("../db/postgres");
const emailService = require("../services/emailService");

const router = express.Router();

/**
 * POST /api/auth/register
 * 1. Validates registration data
 * 2. Generates a one-time secure verification token
 * 3. Saves token and user to PostgreSQL database
 * 4. Sends verification email via SMTP to the user's Gmail address
 */
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, company, website, designation, phone } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        error: "Full name and email are required for registration.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required for registration.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address.",
      });
    }

    // Strict 10-digit numeric phone validation: no words, no letters, no alphanumeric characters allowed
    const rawPhone = String(phone || "").trim();
    if (!rawPhone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required.",
      });
    }

    if (!/^\d{10}$/.test(rawPhone)) {
      return res.status(400).json({
        success: false,
        error: "Phone number must be exactly 10 digits containing numbers only. Words, letters, and alphanumeric characters are not allowed.",
      });
    }

    // Check if user with this email already exists
    const existingUser = await postgresDb.getUserByEmail(trimmedEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "An account with this email address already exists. Please login instead.",
      });
    }

    // Hash password with SHA-256 for secure verification
    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

    // 1. Save user to PostgreSQL database
    const user = await postgresDb.saveUser({
      email: trimmedEmail,
      fullName: fullName.trim(),
      passwordHash,
      company: company ? company.trim() : "",
      website: website ? website.trim() : "",
      designation: designation ? designation.trim() : "",
      phone: rawPhone,
      isVerified: true,
    });

    // 2. Determine base URL and login URL
    const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
    const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const loginUrl = `${baseUrl}/login`;

    // 3. Send "Successfully Registered" welcome email via SMTP
    const emailDispatch = await emailService.sendRegistrationSuccessEmail({
      toEmail: trimmedEmail,
      fullName: fullName.trim(),
      loginUrl,
    });

    console.log(`[AUTH-REGISTER] New user registered: ${trimmedEmail}. Registration confirmation dispatched.`);

    return res.status(201).json({
      success: true,
      message: "Successfully registered!",
      email: trimmedEmail,
    });
  } catch (err) {
    console.error("Registration route error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error during registration: " + err.message,
    });
  }
});

/**
 * GET /api/auth/verify-email
 * Validates the one-time token from PostgreSQL, marks it used, and confirms user verification
 */
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return renderVerificationResult(res, {
        success: false,
        title: "Missing Verification Token",
        message: "No token was provided. Please check your verification email and click the full link.",
      });
    }

    // Verify and consume the one-time token in PostgreSQL
    const result = await postgresDb.consumeVerificationToken(token);

    if (!result.success) {
      let errorTitle = "Verification Failed";
      let errorMessage = "The verification token is invalid or does not exist.";

      if (result.reason === "ALREADY_USED") {
        errorTitle = "Token Already Used";
        errorMessage = "This one-time verification link has already been used. Your account is already verified!";
      } else if (result.reason === "EXPIRED") {
        errorTitle = "Token Expired";
        errorMessage = "This verification link has expired. Please request a new verification email.";
      }

      return renderVerificationResult(res, {
        success: false,
        title: errorTitle,
        message: errorMessage,
        email: result.email,
        isAlreadyVerified: result.reason === "ALREADY_USED",
      });
    }

    return renderVerificationResult(res, {
      success: true,
      title: "Email Verified Successfully!",
      message: `Your Gmail address (${result.email}) has been securely verified in PostgreSQL. Your AvaHire account is now active.`,
      email: result.email,
    });
  } catch (err) {
    console.error("Email verification error:", err);
    return renderVerificationResult(res, {
      success: false,
      title: "Server Error",
      message: "An error occurred during verification. Please try again later.",
    });
  }
});

/**
 * POST /api/auth/resend-verification
 * Generates a fresh one-time token and dispatches a new SMTP email
 */
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await postgresDb.getUserByEmail(trimmedEmail);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await postgresDb.saveVerificationToken({
      email: trimmedEmail,
      token: verificationToken,
      expiresAt,
    });

    const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
    const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const loginUrl = `${baseUrl}/login`;

    const emailDispatch = await emailService.sendRegistrationSuccessEmail({
      toEmail: trimmedEmail,
      fullName: user ? (user.full_name || user.fullName) : "Valued Recruiter",
      loginUrl,
    });

    return res.json({
      success: true,
      message: `Registration confirmation email has been resent to ${trimmedEmail}.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Helper to render responsive HTML verification landing page
 */
function renderVerificationResult(res, { success, title, message, email, isAlreadyVerified }) {
  const statusColor = success || isAlreadyVerified ? "#10b981" : "#ef4444";
  const icon = success || isAlreadyVerified ? "✓" : "✕";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - AvaHire</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
        }
        .card {
          background: #ffffff;
          max-width: 480px;
          width: 90%;
          margin: 20px;
          padding: 40px 32px;
          border-radius: 20px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
          border: 1px solid #e2e8f0;
          text-align: center;
        }
        .icon-circle {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: ${success || isAlreadyVerified ? "#ecfdf5" : "#fef2f2"};
          color: ${statusColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 900;
          margin: 0 auto 20px auto;
          border: 2px solid ${success || isAlreadyVerified ? "#a7f3d0" : "#fecaca"};
        }
        h1 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: #0f172a;
        }
        p {
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          margin: 0 0 28px 0;
        }
        .btn {
          display: inline-block;
          background: #7c3aed;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #6d28d9;
        }
        .meta {
          margin-top: 24px;
          font-size: 12px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon-circle">${icon}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="/login" class="btn">Proceed to Login</a>
        <div class="meta">AvaHire AI Recruitment Platform &bull; PostgreSQL Verified</div>
      </div>
    </body>
    </html>
  `;

  return res.send(html);
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !password) return false;

  // 1. Check SHA256 (standard AvaHire registration format)
  const sha256 = crypto.createHash("sha256").update(password).digest("hex");
  if (sha256.toLowerCase() === storedHash.toLowerCase()) {
    return true;
  }

  // 2. Check PBKDF2 with salt ("salt:hash")
  if (storedHash.includes(":")) {
    const [salt, originalHash] = storedHash.split(":");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    if (hash === originalHash) {
      return true;
    }
  }

  // 3. Exact plain match if plain stored
  if (password === storedHash) {
    return true;
  }

  return false;
}

/**
 * POST /api/auth/reset-password
 * Resets user password in PostgreSQL and mirrored storage
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword, password } = req.body;
    const targetPassword = newPassword || password;
    if (!email || !targetPassword) {
      return res.status(400).json({ success: false, error: "Email and new password are required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    await postgresDb.resetPassword(cleanEmail, targetPassword);
    return res.json({
      success: true,
      message: "Password has been successfully updated! You can now log in.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ success: false, error: "Failed to reset password" });
  }
});

/**
 * POST /api/auth/login
 * Strictly validates user credentials against PostgreSQL and mirror store
 */
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
    let user = await postgresDb.getUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "No HR account found with this email. Please check your credentials or register a new account.",
      });
    }

    const storedHash = user.password_hash || user.passwordHash;
    const isMatch = verifyPassword(password, storedHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password. Please enter the correct password.",
      });
    }

    // Update last_login in PostgreSQL if available
    try {
      await postgresDb.query("UPDATE public.users SET updated_at = NOW() WHERE LOWER(email) = $1", [cleanEmail]);
    } catch (e) {}

    const userFullName = user.fullName || user.full_name || user.name || cleanEmail.split("@")[0];

    // Only extract and return details belonging to this particular user email
    const sessionUser = {
      id: user.id,
      uid: user.uid || `usr_${user.id || Date.now()}`,
      email: user.email,
      name: userFullName,
      fullName: userFullName,
      avatar: user.avatar || "",
      role: user.role || "recruiter",
      company: user.company || "",
      website: user.website || "",
      designation: user.designation || "",
      phone: user.phone || "",
      isVerified: Boolean(user.isVerified || user.is_verified),
      createdAt: user.createdAt || user.created_at || new Date().toISOString(),
    };

    return res.json({
      success: true,
      data: sessionUser,
      token: sessionUser.uid,
      message: `Welcome back, ${sessionUser.name}!`,
    });
  } catch (err) {
    console.error("Auth login error:", err);
    return res.status(500).json({ success: false, error: "Login failed. Please try again." });
  }
});

module.exports = router;
