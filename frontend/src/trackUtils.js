export function parseDuration(str) {
    if (!str || typeof str !== "string") return 210;
    const parts = str.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 210;
}

export function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// Remove disambiguation suffix like "(2)" from Discogs artist names
export function cleanArtistName(name) {
    return (name || "").replace(/\s*\(\d+\)\s*$/, "").trim();
}

// Group tracklist by leading letter in position (A, B, C, ...)
export function groupBySide(tracklist) {
    const sides = {};
    for (const track of tracklist) {
        const match = track.position.match(/^([A-Za-z]+)/);
        const side = match ? match[1].toUpperCase() : "A";
        if (!sides[side]) sides[side] = [];
        sides[side].push(track);
    }
    return sides;
}

// Compute scrobble timestamps. Start from "now" minus total duration so the
// last track ends ~now.
export function computeTimestamps(tracks) {
    const totalDuration = tracks.reduce((sum, t) => sum + parseDuration(t.duration), 0);
    let offset = Math.floor(Date.now() / 1000) - totalDuration;
    return tracks.map(track => {
        const timestamp = offset;
        offset += parseDuration(track.duration);
        return { ...track, timestamp };
    });
}
