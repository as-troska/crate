const db = require("./db");
require("dotenv").config();

// Lazy-loaded to avoid circular dependency (cache → discogs → cache)
function getCache() { return require("./cache"); }

const appId = process.env.DISCOGSAPPID;
const appSecret = process.env.DISCOGSAPPSECRET;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function getNonce() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function getTimeStamp() {
    return Math.floor(Date.now() / 1000);
}

function makeAuthString(oauthToken, oauthSecret) {
    return `OAuth oauth_consumer_key="${appId}", oauth_nonce="${getNonce()}", oauth_token="${oauthToken}", oauth_signature="${appSecret}&${oauthSecret}", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}"`;
}

// ── OAuth flow ────────────────────────────────────────────────────────────────

async function fetchTokens(req, res) {
    const response = await fetch("https://api.discogs.com/oauth/request_token", {
        method: "GET",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `OAuth oauth_consumer_key="${appId}", oauth_nonce="${getNonce()}", oauth_signature="${appSecret}&", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}", oauth_callback="${BASE_URL}/discogs/authorize"`,
            "User-Agent": "Crate/1.0",
        }
    });
    const text = await response.text();

    const parts = text.split("&");
    const token = parts[0].split("=")[1];
    const secret = parts[1].split("=")[1];

    if (!token || !secret) return res.status(500).json({ error: "Failed to get request token from Discogs" });

    db.prepare(
        "UPDATE user_credentials SET discogs_request_token = ?, discogs_request_token_secret = ?, discogs_request_token_expires = ? WHERE user_id = ?"
    ).run(token, secret, getTimeStamp() + 900, req.userId);

    res.json({ requestToken: token });
}

async function hasTokens(req, res) {
    const creds = db.prepare("SELECT * FROM user_credentials WHERE user_id = ?").get(req.userId);

    if (creds?.discogs_oauth_token) {
        res.json({ status: "authorized" });
    } else if (creds?.discogs_request_token && creds.discogs_request_token_expires > getTimeStamp()) {
        res.json({ status: "pending", requestToken: creds.discogs_request_token });
    } else {
        res.json({ status: "unauthorized" });
    }
}

// OAuth callback — Discogs redirects here after the user authorizes.
// No auth middleware; we identify the user by matching the request token.
async function captureVerifier(req, res) {
    const { oauth_token, oauth_verifier } = req.query;

    const creds = db.prepare(
        "SELECT * FROM user_credentials WHERE discogs_request_token = ?"
    ).get(oauth_token);

    if (!creds) return res.status(400).send("Unknown OAuth token");

    const authString = `OAuth oauth_consumer_key="${appId}", oauth_nonce="${getNonce()}", oauth_token="${oauth_token}", oauth_signature="${appSecret}&${creds.discogs_request_token_secret}", oauth_signature_method="PLAINTEXT", oauth_timestamp="${getTimeStamp()}", oauth_verifier="${oauth_verifier}"`;

    const response = await fetch("https://api.discogs.com/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": authString,
            "User-Agent": "Crate/1.0"
        }
    });
    const text = await response.text();

    const parts = text.split("&");
    const oauthToken = parts[0].split("=")[1];
    const oauthSecret = parts[1].split("=")[1];

    db.prepare(
        "UPDATE user_credentials SET discogs_oauth_token = ?, discogs_oauth_token_secret = ?, discogs_request_token = NULL, discogs_request_token_secret = NULL WHERE user_id = ?"
    ).run(oauthToken, oauthSecret, creds.user_id);

    // Kick off collection sync in the background immediately after OAuth completes
    getCache().syncCollection(creds.user_id).catch(e => console.error("Post-OAuth sync error:", e.message));

    res.redirect(FRONTEND_URL + "/");
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function getIdentityForUser(userId) {
    const creds = db.prepare("SELECT * FROM user_credentials WHERE user_id = ?").get(userId);
    const response = await fetch("https://api.discogs.com/oauth/identity", {
        headers: {
            "Authorization": makeAuthString(creds.discogs_oauth_token, creds.discogs_oauth_token_secret),
            "User-Agent": "Crate/1.0"
        }
    });
    return await response.json();
}

async function getCollectionFromDiscogs(userId) {
    const identity = await getIdentityForUser(userId);
    const creds = db.prepare("SELECT * FROM user_credentials WHERE user_id = ?").get(userId);
    const auth = makeAuthString(creds.discogs_oauth_token, creds.discogs_oauth_token_secret);

    const releases = [];
    let page = 1;
    let pages = 1;

    do {
        if (page > 1) await new Promise(r => setTimeout(r, 1100)); // respect rate limit between pages
        const url = `https://api.discogs.com/users/${identity.username}/collection/folders/0/releases?per_page=100&page=${page}`;
        const response = await fetch(url, { headers: { "Authorization": auth, "User-Agent": "Crate/1.0" } });
        const data = await response.json();
        pages = data.pagination.pages;
        for (const r of data.releases) releases.push(r);
        page++;
    } while (page <= pages);

    return releases;
}

// ── API handlers ──────────────────────────────────────────────────────────────

async function getCollection(req, res) {
    const rows = db.prepare(`
        SELECT c.instance_id, c.release_id, c.date_added, c.basic_information, r.data
        FROM collections c
        LEFT JOIN releases r ON c.release_id = r.release_id
        WHERE c.user_id = ?
        ORDER BY c.date_added DESC
    `).all(req.userId);

    const collection = rows.map(row => ({
        instance_id: row.instance_id,
        release_id: row.release_id,
        date_added: row.date_added,
        basic_information: row.basic_information ? JSON.parse(row.basic_information) : null,
        release_data: row.data ? JSON.parse(row.data) : null
    }));

    res.json(collection);
}

async function getTracklist(req, res) {
    const { releaseId } = req.params;

    let row = db.prepare("SELECT data FROM releases WHERE release_id = ?").get(releaseId);

    if (!row) {
        const creds = db.prepare("SELECT * FROM user_credentials WHERE user_id = ?").get(req.userId);
        const response = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
            headers: {
                "Authorization": makeAuthString(creds.discogs_oauth_token, creds.discogs_oauth_token_secret),
                "User-Agent": "Crate/1.0"
            }
        });
        const data = await response.json();
        db.prepare("INSERT OR REPLACE INTO releases (release_id, data, fetched_at) VALUES (?, ?, ?)")
            .run(releaseId, JSON.stringify(data), getTimeStamp());
        row = { data: JSON.stringify(data) };
    }

    const release = JSON.parse(row.data);
    res.json({
        albumTitle: release.title,
        albumArtist: release.artists?.[0]?.name || "",
        tracklist: (release.tracklist || []).filter(t => t.type_ === "track"),
        images: release.images || [],
        year: release.year,
        country: release.country,
        formats: release.formats || [],
        labels: release.labels || [],
        genres: release.genres || [],
        styles: release.styles || [],
        community: release.community,
        notes: release.notes,
        videos: release.videos || [],
        extraartists: release.extraartists || [],
        numForSale: release.num_for_sale ?? 0,
        lowestPrice: release.lowest_price ?? null,
        identifiers: release.identifiers || [],
        masterId: release.master_id || null,
    });
}

async function refreshRelease(req, res) {
    const { releaseId } = req.params;
    const creds = db.prepare("SELECT * FROM user_credentials WHERE user_id = ?").get(req.userId);

    const response = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
        headers: {
            "Authorization": makeAuthString(creds.discogs_oauth_token, creds.discogs_oauth_token_secret),
            "User-Agent": "Crate/1.0"
        }
    });
    const data = await response.json();

    db.prepare("INSERT OR REPLACE INTO releases (release_id, data, fetched_at) VALUES (?, ?, ?)")
        .run(releaseId, JSON.stringify(data), getTimeStamp());

    res.json({ ok: true });
}

exports.fetchTokens = fetchTokens;
exports.hasTokens = hasTokens;
exports.captureVerifier = captureVerifier;
exports.getCollection = getCollection;
exports.getTracklist = getTracklist;
exports.refreshRelease = refreshRelease;
exports.getCollectionFromDiscogs = getCollectionFromDiscogs;
exports.makeAuthString = makeAuthString;
exports.getTimeStamp = getTimeStamp;
