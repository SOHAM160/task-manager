const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const User = require("../models/User");

const SESSION_COOKIE = "sessionId";

/**
 * Authentication middleware.
 * Checks for session ID in cookie or Session-ID header (multi-tab support).
 * Attaches req.user on success.
 */
async function auth(req, res, next) {
  try {
    // 1. Try header first (for multi-tab support)
    let sessionId = req.headers["session-id"];

    // 2. Fallback to cookie
    if (!sessionId) {
      sessionId = req.cookies[SESSION_COOKIE];
    }

    if (!sessionId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const session = await Session.findById(sessionId).populate("userId");
    if (!session) {
      return res.status(401).json({ error: "Session not found" });
    }

    if (session.expiresAt < new Date()) {
      await Session.findByIdAndDelete(session._id);
      return res.status(401).json({ error: "Session expired" });
    }

    // Attach the user object (populated from userId)
    req.user = session.userId;
    req.sessionId = sessionId;

    next();
  } catch (err) {
    console.error("[AUTH_MIDDLEWARE]", err.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
}

module.exports = auth;
