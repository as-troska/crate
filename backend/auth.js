const db = require("./db");
const crypto = require("crypto");
require("dotenv").config();

const SESSION_DAYS = parseInt(process.env.SESSION_DAYS || "30", 10);
const SESSION_TTL = SESSION_DAYS * 24 * 60 * 60; // seconds

// ── Rate limiting (in-memory, per IP) ────────────────────────────────────────
const loginAttempts = new Map(); // ip → { count, resetAt }
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip) {
    const now = Date.now();
    let entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + WINDOW_MS };
    }
    entry.count++;
    loginAttempts.set(ip, entry);
    return entry.count > MAX_ATTEMPTS;
}

function clearRateLimit(ip) {
    loginAttempts.delete(ip);
}

// ── Input validation ──────────────────────────────────────────────────────────
function validateCredentials(username, password) {
    if (!username || !password) return "Username and password required";
    if (typeof username !== "string" || typeof password !== "string") return "Invalid input";
    if (username.length > 50) return "Username too long";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password.length > 200) return "Password too long";
    if (!/^[\w\-\.]+$/.test(username)) return "Username may only contain letters, numbers, - _ .";
    return null;
}

// ── Handlers ──────────────────────────────────────────────────────────────────
function register(req, res) {
    const { username, password } = req.body;
    const err = validateCredentials(username, password);
    if (err) return res.status(400).json({ error: err });

    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (scryptErr, hash) => {
        if (scryptErr) return res.status(500).json({ error: "Server error" });

        const passwordHash = salt + ":" + hash.toString("hex");
        const now = Math.floor(Date.now() / 1000);

        try {
            const result = db.prepare(
                "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)"
            ).run(username, passwordHash, now);

            db.prepare("INSERT INTO user_credentials (user_id) VALUES (?)").run(result.lastInsertRowid);

            const token = crypto.randomBytes(32).toString("hex");
            db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
                token, result.lastInsertRowid, now, now + SESSION_TTL
            );

            res.json({ token, username, userId: result.lastInsertRowid });
        } catch (e) {
            if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "Username already taken" });
            res.status(500).json({ error: "Server error" });
        }
    });
}

function login(req, res) {
    const ip = req.ip;
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
    }

    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    if (typeof username !== "string" || typeof password !== "string") return res.status(400).json({ error: "Invalid input" });

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user) {
        // Run scrypt anyway to prevent timing-based username enumeration
        crypto.scrypt(password, crypto.randomBytes(16).toString("hex"), 64, () => {});
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const [salt, storedHex] = user.password_hash.split(":");
    crypto.scrypt(password, salt, 64, (err, hash) => {
        if (err) return res.status(500).json({ error: "Server error" });

        const storedBuf = Buffer.from(storedHex, "hex");
        // Timing-safe comparison
        if (hash.length !== storedBuf.length || !crypto.timingSafeEqual(hash, storedBuf)) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        clearRateLimit(ip);
        const token = crypto.randomBytes(32).toString("hex");
        const now = Math.floor(Date.now() / 1000);
        db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
            token, user.id, now, now + SESSION_TTL
        );

        res.json({ token, username, userId: user.id });
    });
}

function logout(req, res) {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    res.json({ ok: true });
}

function me(req, res) {
    res.json({ userId: req.userId, username: req.username });
}

function deleteAccount(req, res) {
    const userId = req.userId;
    // Delete all user data in dependency order
    db.prepare("DELETE FROM collections WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM user_credentials WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    res.json({ ok: true });
}

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const now = Math.floor(Date.now() / 1000);
    const session = db.prepare(
        "SELECT s.user_id, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND (s.expires_at IS NULL OR s.expires_at > ?)"
    ).get(token, now);

    if (!session) {
        // Clean up expired token if it exists
        db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
        return res.status(401).json({ error: "Invalid session" });
    }

    req.userId = session.user_id;
    req.username = session.username;
    next();
}

exports.register = register;
exports.login = login;
exports.logout = logout;
exports.me = me;
exports.deleteAccount = deleteAccount;
exports.authMiddleware = authMiddleware;
