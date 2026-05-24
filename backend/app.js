const express = require("express");
const cors = require("cors");
const path = require("path");
const auth = require("./auth");
const discogs = require("./discogs");
const lastfm = require("./lastfm");
const cache = require("./cache");
const imgcache = require("./imgcache");

const app = express();
const port = 3000;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const isProd = process.env.NODE_ENV === "production";

app.use(cors({ origin: isProd ? false : FRONTEND_URL }));
app.use(express.json({ limit: "100kb" }));

// Serve built frontend in production
if (isProd) {
    const publicDir = path.join(__dirname, "public");
    app.use(express.static(publicDir));
}

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post("/auth/register", auth.register);
app.post("/auth/login", auth.login);
app.post("/auth/logout", auth.logout);
app.get("/auth/me", auth.authMiddleware, auth.me);
app.delete("/auth/account", auth.authMiddleware, auth.deleteAccount);

// ── Discogs ───────────────────────────────────────────────────────────────────
app.get("/discogs/fetchTokens", auth.authMiddleware, discogs.fetchTokens);
app.get("/discogs/hasTokens", auth.authMiddleware, discogs.hasTokens);
app.get("/discogs/authorize", discogs.captureVerifier);   // OAuth callback, no session needed
app.get("/discogs/collection", auth.authMiddleware, discogs.getCollection);
app.get("/discogs/tracklist/:releaseId", auth.authMiddleware, discogs.getTracklist);
app.post("/discogs/refreshRelease/:releaseId", auth.authMiddleware, discogs.refreshRelease);

// ── Last.fm ───────────────────────────────────────────────────────────────────
app.get("/lastfm/startAuth", auth.authMiddleware, lastfm.startAuth);
app.get("/lastfm/auth", lastfm.authorize);                // OAuth callback with state token
app.get("/lastfm/checkAuthorized", auth.authMiddleware, lastfm.checkAuthorized);
app.post("/lastfm/scrobble", auth.authMiddleware, lastfm.scrobble);
app.post("/lastfm/nowPlaying", auth.authMiddleware, lastfm.updateNowPlaying);

// ── Image cache ───────────────────────────────────────────────────────────────
app.get("/img", imgcache.serveImage);

// ── Sync ──────────────────────────────────────────────────────────────────────
app.get("/syncStatus", auth.authMiddleware, cache.getSyncStatus);
app.post("/syncCollection", auth.authMiddleware, (req, res) => {
    const force = req.body?.force === true;
    cache.syncCollection(req.userId, { force }).catch(e => console.error("Sync error:", e.message));
    res.json({ ok: true });
});

// SPA fallback — must be after all API routes
if (isProd) {
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "index.html"));
    });
}

app.listen(port, async () => {
    console.log("Backend running at: http://localhost:" + port);
    await cache.startupSync();
});
