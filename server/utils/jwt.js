const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "avahire_jwt_secret_token_secure_2026_recruiter_platform_super_key";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Sign a JWT token for an authenticated user session
 * @param {Object} user - User object with id/uid, email, name, role
 * @param {Object} [customOptions] - Optional jwt sign options
 * @returns {string} - Signed JWT token
 */
function signToken(user, customOptions = {}) {
  const payload = {
    id: user.id,
    uid: user.uid || (user.id ? `usr_${user.id}` : `usr_${Date.now()}`),
    email: (user.email || "").toLowerCase().trim(),
    name: user.fullName || user.name || "",
    role: user.role || "recruiter",
  };

  const options = {
    expiresIn: JWT_EXPIRES_IN,
    ...customOptions,
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Synchronously or asynchronously verify a JWT token
 * @param {string} token
 * @returns {Object|null} Decoded payload or null if invalid
 */
function verifyToken(token) {
  if (!token) return null;
  try {
    const cleanToken = token.startsWith("Bearer ")
      ? token.slice(7).trim()
      : token.trim();
    return jwt.verify(cleanToken, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Express Middleware to require and validate JWT tokens
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "Authentication token missing. Please sign in.",
    });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired session token. Please sign in again.",
    });
  }

  req.user = decoded;
  next();
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  signToken,
  verifyToken,
  authenticateToken,
};
