const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Session = require("../models/Session");

const SESSION_COOKIE = "sessionId";
const SESSION_TTL_HOURS = 24;
const REMEMBER_ME_TTL_DAYS = 30;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

async function createSession(res, userId, rememberMe) {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() +
      (rememberMe
        ? REMEMBER_ME_TTL_DAYS * 24 * 60 * 60 * 1000
        : SESSION_TTL_HOURS * 60 * 60 * 1000)
  );

  const session = await Session.create({ userId, expiresAt });

  res.cookie(SESSION_COOKIE, session._id.toString(), {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? "none" : "lax",
    path: "/",
    expires: expiresAt,
  });

  return session._id.toString();
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const email = (req.body.email || "").toString().trim().toLowerCase();
    const password = (req.body.password || "").toString();
    const rememberMe = Boolean(req.body.rememberMe);

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: passwordHash });

    const sessionId = await createSession(res, user._id, rememberMe);

    return res.json({ success: true, sessionId });
  } catch (err) {
    console.error("[REGISTER_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const email = (req.body.email || "").toString().trim().toLowerCase();
    const password = (req.body.password || "").toString();
    const rememberMe = Boolean(req.body.rememberMe);

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const sessionId = await createSession(res, user._id, rememberMe);

    return res.json({ success: true, sessionId });
  } catch (err) {
    console.error("[LOGIN_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  // req.user is set by the auth middleware
  return res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
    },
    sessionId: req.sessionId,
  });
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const sessionId =
      req.headers["session-id"] || req.cookies[SESSION_COOKIE];

    if (sessionId) {
      await Session.findByIdAndDelete(sessionId);
    }

    res.cookie(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: IS_PRODUCTION ? "none" : "lax",
      path: "/",
      maxAge: 0,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("[LOGOUT_ERROR]", err);
    return res.json({ success: true });
  }
};
