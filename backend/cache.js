const db = require("./db");
const discogs = require("./discogs");
const imgcache = require("./imgcache");

const SYNC_COOLDOWN_S = 5 * 60; // 5 minutes between automatic syncs

const state = {
    running: false,
    total: 0,
    done: 0,
    errors: 0,
    queue: []
};

// Returns true if the user was synced recently and we should skip.
function isOnCooldown(userId) {
    const creds = db.prepare("SELECT last_synced_at FROM user_credentials WHERE user_id = ?").get(userId);
    if (!creds?.last_synced_at) return false;
    return (Math.floor(Date.now() / 1000) - creds.last_synced_at) < SYNC_COOLDOWN_S;
}

async function syncCollection(userId, { force = false } = {}) {
    if (!force && isOnCooldown(userId)) {
        console.log(`Sync skipped for user ${userId} (last sync < 1h ago)`);
        return;
    }

    const releases = await discogs.getCollectionFromDiscogs(userId);

    const existing = db.prepare("SELECT instance_id FROM collections WHERE user_id = ?").all(userId);
    const existingIds = new Set(existing.map(r => r.instance_id));
    const freshIds = new Set(releases.map(r => r.instance_id));

    const newCoverUrls = [];

    for (const release of releases) {
        if (!existingIds.has(release.instance_id)) {
            const dateAdded = release.date_added
                ? Math.floor(new Date(release.date_added).getTime() / 1000)
                : null;
            db.prepare(
                "INSERT OR REPLACE INTO collections (user_id, instance_id, release_id, date_added, basic_information) VALUES (?, ?, ?, ?, ?)"
            ).run(userId, release.instance_id, release.id, dateAdded, JSON.stringify(release.basic_information));

            const cover = release.basic_information?.cover_image;
            if (cover) newCoverUrls.push(cover);

            const cached = db.prepare("SELECT release_id FROM releases WHERE release_id = ?").get(release.id);
            const alreadyQueued = state.queue.some(q => q.releaseId === release.id);
            if (!cached && !alreadyQueued) {
                state.queue.push({ releaseId: release.id, userId });
                state.total++;
            }
        }
    }

    for (const { instance_id } of existing) {
        if (!freshIds.has(instance_id)) {
            db.prepare("DELETE FROM collections WHERE user_id = ? AND instance_id = ?").run(userId, instance_id);
        }
    }

    // Record sync time before potentially slow image preloading
    db.prepare("UPDATE user_credentials SET last_synced_at = ? WHERE user_id = ?")
        .run(Math.floor(Date.now() / 1000), userId);

    // Only preload covers for newly added records (not the whole collection every time)
    if (newCoverUrls.length > 0) {
        console.log(`Preloading ${newCoverUrls.length} new cover images...`);
        imgcache.preload(newCoverUrls).catch(() => {});
    }

    if (!state.running && state.queue.length > 0) {
        state.running = true;
        processQueue();
    }
}

async function processQueue() {
    if (state.queue.length === 0) {
        state.running = false;
        return;
    }

    const { releaseId, userId } = state.queue.shift();

    try {
        const creds = db.prepare(
            "SELECT discogs_oauth_token, discogs_oauth_token_secret FROM user_credentials WHERE user_id = ?"
        ).get(userId);

        if (creds?.discogs_oauth_token) {
            const auth = discogs.makeAuthString(creds.discogs_oauth_token, creds.discogs_oauth_token_secret);
            const response = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
                headers: { "Authorization": auth, "User-Agent": "Crate/1.0" }
            });
            const data = await response.json();
            db.prepare("INSERT OR REPLACE INTO releases (release_id, data, fetched_at) VALUES (?, ?, ?)")
                .run(releaseId, JSON.stringify(data), discogs.getTimeStamp());
        }
        state.done++;
    } catch (e) {
        console.error(`Error fetching release ${releaseId}:`, e.message);
        state.errors++;
    }

    setTimeout(processQueue, 1100); // 1 req/sec — within Discogs' 60/min limit
}

function getSyncStatus(req, res) {
    const creds = db.prepare("SELECT last_synced_at FROM user_credentials WHERE user_id = ?").get(req.userId);
    res.json({
        total: state.total,
        done: state.done,
        errors: state.errors,
        running: state.running,
        queued: state.queue.length,
        lastSyncedAt: creds?.last_synced_at || null
    });
}

async function startupSync() {
    const users = db.prepare(
        "SELECT user_id FROM user_credentials WHERE discogs_oauth_token IS NOT NULL"
    ).all();

    for (const { user_id } of users) {
        try {
            console.log(`Syncing collection for user ${user_id}...`);
            await syncCollection(user_id); // respects cooldown
        } catch (e) {
            console.error(`Startup sync failed for user ${user_id}:`, e.message);
        }
    }
}

exports.syncCollection = syncCollection;
exports.getSyncStatus = getSyncStatus;
exports.startupSync = startupSync;
