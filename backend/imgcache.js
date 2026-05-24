const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CACHE_DIR = path.join(__dirname, "imgcache");

// Whitelist: only fetch from known Discogs CDN hostnames.
// This prevents SSRF (Server-Side Request Forgery) attacks where a malicious
// URL could reach internal network resources or cloud metadata endpoints.
const ALLOWED_HOSTS = new Set([
    "i.discogs.com",
    "img.discogs.com",
    "s.discogs.com",
    "st.discogs.com",
]);

function isAllowedUrl(url) {
    try {
        const { hostname, protocol } = new URL(url);
        return protocol === "https:" && ALLOWED_HOSTS.has(hostname);
    } catch {
        return false;
    }
}

function hashUrl(url) {
    return crypto.createHash("md5").update(url).digest("hex");
}

function extFromUrl(url) {
    const m = url.match(/\.(jpe?g|png|gif|webp)/i);
    return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

function cachedPath(url) {
    return path.join(CACHE_DIR, hashUrl(url) + "." + extFromUrl(url));
}

async function serveImage(req, res) {
    const url = req.query.u;
    if (!url) return res.status(400).send("Missing url");
    if (!isAllowedUrl(url)) return res.status(403).send("URL not allowed");

    const filepath = cachedPath(url);

    if (fs.existsSync(filepath)) {
        return res.sendFile(filepath);
    }

    try {
        const response = await fetch(url, { headers: { "User-Agent": "Crate/1.0" } });
        if (!response.ok) return res.status(404).send("Image not found");

        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(filepath, buffer);

        res.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        res.send(buffer);
    } catch (e) {
        console.error("Image fetch error:", e.message);
        res.status(502).send("Failed to fetch image");
    }
}

async function preload(urls) {
    for (const url of urls) {
        if (!url || !isAllowedUrl(url)) continue;
        const filepath = cachedPath(url);
        if (fs.existsSync(filepath)) continue;
        try {
            const response = await fetch(url, { headers: { "User-Agent": "Crate/1.0" } });
            if (!response.ok) continue;
            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(filepath, buffer);
        } catch {
            // Non-critical — skip silently
        }
        await new Promise(r => setTimeout(r, 1500)); // ~0.7 images/sec — respectful CDN use
    }
}

exports.serveImage = serveImage;
exports.preload = preload;
exports.cachedPath = cachedPath;
