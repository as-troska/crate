import { API } from "./api";
import React, { useState, useEffect } from "react";
import { cleanArtistName, groupBySide, computeTimestamps, parseDuration, formatDuration } from "./trackUtils";
import { imgUrl } from "./imgUrl";

export default function RecordDetail({ token, release, onBack, onNowPlaying }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageIdx, setImageIdx] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    function authFetch(url, opts = {}) {
        return fetch(API + url, {
            ...opts,
            headers: { ...opts.headers, "Authorization": "Bearer " + token }
        });
    }

    useEffect(() => {
        loadDetail();
    }, [release.release_id]);

    async function loadDetail() {
        setLoading(true);
        const res = await authFetch(`/discogs/tracklist/${release.release_id}`);
        const data = await res.json();
        setDetail(data);
        setLoading(false);
    }

    async function handleRefresh() {
        setRefreshing(true);
        await authFetch(`/discogs/refreshRelease/${release.release_id}`, { method: "POST" });
        await loadDetail();
        setRefreshing(false);
    }

    async function scrobbleTracks(tracks) {
        const artist = cleanArtistName(detail.albumArtist);
        const album = detail.albumTitle;
        const withTimestamps = computeTimestamps(tracks);

        await authFetch("/lastfm/scrobble", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tracks: withTimestamps.map(t => ({
                    artist,
                    track: t.title,
                    album,
                    duration: parseDuration(t.duration),
                    timestamp: t.timestamp
                }))
            })
        });

        const coverImage = imgUrl(detail.images?.[0]?.uri || release.basic_information?.cover_image || "");
        onNowPlaying({
            tracks: withTimestamps.map(t => ({ ...t, artist, albumTitle: album, albumArtist: artist })),
            currentIndex: 0,
            albumTitle: album,
            albumArtist: artist,
            coverImage
        });
    }

    if (loading) return (
        <div className="detail-page">
            <button className="btn-ghost back-btn" onClick={onBack}>← Back</button>
            <p className="loading-msg">Loading…</p>
        </div>
    );

    const { albumTitle, albumArtist, tracklist, images, year, country, formats, labels, genres, styles, notes, videos } = detail;
    const artist = cleanArtistName(albumArtist);
    const sides = groupBySide(tracklist);
    const formatStr = formats?.map(f => [f.name, ...(f.descriptions || [])].join(", ")).join(" / ") || "";
    const labelStr = labels?.map(l => l.name).join(", ") || "";
    const coverImages = (images?.filter(i => i.type === "primary").concat(images?.filter(i => i.type !== "primary")) || [])
        .map(i => ({ ...i, uri: imgUrl(i.uri) }));

    return (
        <div className="detail-page">
            <button className="btn-ghost back-btn" onClick={onBack}>← Back</button>

            <div className="detail-layout">
                <div className="detail-left">
                    {coverImages.length > 0 && (
                        <div className="image-carousel">
                            <img
                                src={coverImages[imageIdx]?.uri}
                                alt={albumTitle}
                                className="carousel-img"
                            />
                            {coverImages.length > 1 && (
                                <div className="carousel-dots">
                                    {coverImages.map((_, i) => (
                                        <button
                                            key={i}
                                            className={`dot${i === imageIdx ? " active" : ""}`}
                                            onClick={() => setImageIdx(i)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="detail-meta">
                        <h1 className="detail-title">{albumTitle}</h1>
                        <p className="detail-artist">{artist}</p>
                        <div className="detail-tags">
                            {year && <span className="tag">{year}</span>}
                            {country && <span className="tag">{country}</span>}
                            {formatStr && <span className="tag">{formatStr}</span>}
                            {labelStr && <span className="tag">{labelStr}</span>}
                        </div>
                        {genres?.length > 0 && (
                            <p className="detail-genres">{genres.concat(styles || []).join(" · ")}</p>
                        )}
                        {detail.community?.rating?.average && (
                            <p className="detail-rating">
                                ★ {detail.community.rating.average.toFixed(2)} ({detail.community.rating.count} ratings)
                            </p>
                        )}
                        {notes && <p className="detail-notes">{notes}</p>}
                    </div>

                    <div className="detail-actions">
                        <button className="btn-primary" onClick={() => scrobbleTracks(tracklist)}>
                            Scrobble full album
                        </button>
                        <button className="btn-ghost" onClick={handleRefresh} disabled={refreshing}>
                            {refreshing ? "Refreshing…" : "Refresh data"}
                        </button>
                    </div>

                    {videos?.length > 0 && (
                        <div className="detail-videos">
                            <h3>Videos</h3>
                            {videos.map((v, i) => (
                                <a key={i} href={v.uri} target="_blank" rel="noopener noreferrer" className="video-link">
                                    {v.title || v.uri}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <div className="detail-right">
                    <div className="tracklist">
                        {Object.entries(sides).map(([side, tracks]) => (
                            <div key={side} className="side-section">
                                <div className="side-header">
                                    <h3>Side {side}</h3>
                                    <button className="btn-ghost btn-small" onClick={() => scrobbleTracks(tracks)}>
                                        Scrobble side {side}
                                    </button>
                                </div>
                                {tracks.map((track, i) => (
                                    <TrackRow
                                        key={i}
                                        track={track}
                                        artist={artist}
                                        album={albumTitle}
                                        onScrobble={() => scrobbleTracks([track])}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrackRow({ track, artist, album, onScrobble }) {
    const dur = track.duration ? formatDuration(parseDuration(track.duration)) : null;
    return (
        <div className="track-row">
            <span className="track-pos">{track.position}</span>
            <span className="track-title">{track.title}</span>
            {dur && <span className="track-dur">{dur}</span>}
            <button className="btn-icon" onClick={onScrobble} title="Scrobble this track">▶</button>
        </div>
    );
}
