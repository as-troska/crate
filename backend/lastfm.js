const db = require("./db");
const md5 = require("md5");
const crypto = require("crypto");
require("dotenv").config();

const apiKey = process.env.LASTFMAPIKEY;
const secret = process.env.LASTFMSECRET;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── OAuth state tokens ────────────────────────────────────────────────────────
// Short-lived in-memory map: state → { userId, expires }
// Prevents CSRF on the Last.fm callback: instead of exposing the userId in the
// callback URL (which lets anyone overwrite anyone's session key), we issue a
// random one-time token that only the legitimate user's browser holds.
const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Clean up expired states periodically
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of pendingStates) {
        if (now > v.expires) pendingStates.delete(k);
    }
}, 60_000);

// Authenticated: generate a state token and return the full Last.fm auth URL.
function startAuth(req, res) {
    const state = crypto.randomBytes(24).toString("hex");
    pendingStates.set(state, { userId: req.userId, expires: Date.now() + STATE_TTL_MS });
    const cb = encodeURIComponent(`${BASE_URL}/lastfm/auth?state=${state}`);
    res.json({ authUrl: `http://www.last.fm/api/auth/?api_key=${apiKey}&cb=${cb}` });
}

// OAuth callback — Last.fm redirects here with ?state=<token>&token=<lfm_token>
async function authorize(req, res) {
    const { state, token } = req.query;

    const pending = pendingStates.get(state);
    if (!pending || Date.now() > pending.expires) {
        return res.status(400).send("Invalid or expired state token. Please try connecting again.");
    }
    pendingStates.delete(state); // one-time use

    if (!token) return res.status(400).send("No Last.fm token provided");

    const sigParams = { api_key: apiKey, method: "auth.getSession", token };
    const sigStr = Object.keys(sigParams).sort().map(k => k + sigParams[k]).join("") + secret;
    console.log("[lastfm] token:", token);
    console.log("[lastfm] apiKey length:", apiKey?.length, "secret length:", secret?.length);
    console.log("[lastfm] sig string (no secret):", Object.keys(sigParams).sort().map(k => k + sigParams[k]).join(""));
    const sig = makeSignature(sigParams);
    const url = `http://ws.audioscrobbler.com/2.0/?method=auth.getSession&token=${token}&api_key=${apiKey}&api_sig=${sig}`;

    const result = await fetch(url);
    const text = await result.text();
    console.log("[lastfm] auth.getSession response:", text);

    const key = text.split("<key>")[1]?.split("</key>")[0];
    if (!key) {
        console.error("Last.fm session key error:", text);
        return res.status(400).send("Failed to get Last.fm session key: " + text);
    }

    db.prepare("UPDATE user_credentials SET lastfm_session_key = ? WHERE user_id = ?")
        .run(key, pending.userId);

    res.redirect(FRONTEND_URL + "/");
}

function checkAuthorized(req, res) {
    const creds = db.prepare("SELECT lastfm_session_key FROM user_credentials WHERE user_id = ?").get(req.userId);
    res.json({ authorized: !!creds?.lastfm_session_key });
}

// ── Scrobbling ────────────────────────────────────────────────────────────────
function makeSignature(params) {
    const str = Object.keys(params).sort().map(k => k + params[k]).join("") + secret;
    return md5(str);
}

async function scrobble(req, res) {
    const { tracks } = req.body;
    if (!Array.isArray(tracks) || tracks.length === 0) {
        return res.status(400).json({ error: "tracks must be a non-empty array" });
    }

    const creds = db.prepare("SELECT lastfm_session_key FROM user_credentials WHERE user_id = ?").get(req.userId);
    if (!creds?.lastfm_session_key) return res.status(401).json({ error: "Not authorized with Last.fm" });

    const params = { api_key: apiKey, method: "track.scrobble", sk: creds.lastfm_session_key };
    tracks.forEach((t, i) => {
        params[`artist[${i}]`] = String(t.artist).slice(0, 500);
        params[`track[${i}]`] = String(t.track).slice(0, 500);
        params[`timestamp[${i}]`] = String(t.timestamp);
        if (t.album) params[`album[${i}]`] = String(t.album).slice(0, 500);
        if (t.duration) params[`duration[${i}]`] = String(t.duration);
    });
    params.api_sig = makeSignature(params);

    const body = new URLSearchParams(params);
    const result = await fetch("http://ws.audioscrobbler.com/2.0/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });

    res.json({ ok: true, response: await result.text() });
}

async function updateNowPlaying(req, res) {
    const { artist, track, album, duration } = req.body;
    if (!artist || !track) return res.status(400).json({ error: "artist and track required" });

    const creds = db.prepare("SELECT lastfm_session_key FROM user_credentials WHERE user_id = ?").get(req.userId);
    if (!creds?.lastfm_session_key) return res.status(401).json({ error: "Not authorized with Last.fm" });

    const params = {
        api_key: apiKey,
        method: "track.updateNowPlaying",
        artist: String(artist).slice(0, 500),
        track: String(track).slice(0, 500),
        sk: creds.lastfm_session_key
    };
    if (album) params.album = String(album).slice(0, 500);
    if (duration) params.duration = String(duration);
    params.api_sig = makeSignature(params);

    const body = new URLSearchParams(params);
    const result = await fetch("http://ws.audioscrobbler.com/2.0/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });

    res.json({ ok: true, response: await result.text() });
}

exports.startAuth = startAuth;
exports.authorize = authorize;
exports.checkAuthorized = checkAuthorized;
exports.scrobble = scrobble;
exports.updateNowPlaying = updateNowPlaying;
