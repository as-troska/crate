import { API } from "./api";
import React, { useState, useEffect, useRef } from "react";
import { parseDuration, formatDuration } from "./trackUtils";

export default function NowPlaying({ token, nowPlaying, onEnd, onAdvance }) {
    const { tracks, currentIndex, albumTitle, albumArtist, coverImage } = nowPlaying;
    const track = tracks[currentIndex];
    const duration = parseDuration(track.duration);

    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef(null);
    const startedAt = useRef(Date.now());

    // Reset timer when track changes
    useEffect(() => {
        startedAt.current = Date.now();
        setElapsed(0);
        postNowPlaying();

        intervalRef.current = setInterval(() => {
            const secs = Math.floor((Date.now() - startedAt.current) / 1000);
            setElapsed(secs);

            if (secs >= duration) {
                clearInterval(intervalRef.current);
                const nextIndex = currentIndex + 1;
                if (nextIndex < tracks.length) {
                    onAdvance({ ...nowPlaying, currentIndex: nextIndex });
                } else {
                    onEnd();
                }
            }
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [currentIndex]);

    async function postNowPlaying() {
        try {
            await fetch(API + "/lastfm/nowPlaying", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    artist: track.artist || albumArtist,
                    track: track.title,
                    album: albumTitle,
                    duration
                })
            });
        } catch {
            // non-critical
        }
    }

    const progressPct = duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0;

    return (
        <div className="now-playing-bar">
            {coverImage && (
                <img src={coverImage} alt={albumTitle} className="np-cover" />
            )}
            <div className="np-info">
                <span className="np-track">{track.position && `${track.position} – `}{track.title}</span>
                <span className="np-album">{albumArtist} — {albumTitle}</span>
            </div>
            <div className="np-controls">
                <span className="np-time">{formatDuration(elapsed)} / {formatDuration(duration)}</span>
                <button className="btn-icon np-stop" onClick={onEnd} title="Stop">■</button>
            </div>
            <div className="np-progress">
                <div className="np-progress-fill" style={{ width: progressPct + "%" }} />
            </div>
        </div>
    );
}
