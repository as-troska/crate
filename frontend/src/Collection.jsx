import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { API } from "./api";
import { imgUrl } from "./imgUrl";
import { cleanArtistName, parseDuration, computeTimestamps } from "./trackUtils";
import { DIRECTIONS, TYPE_PAIRINGS, I18N } from "./themes";

// ─── Helpers ──────────────────────────────────────────────────────────────

const fmtDur = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

function normalizeAlbum(item) {
  const bi = item.basic_information || {};
  const artistName = bi.artists?.[0]?.name || "Unknown Artist";
  return {
    id: item.instance_id,
    releaseId: item.release_id,
    title: bi.title || "Unknown",
    artist: cleanArtistName(artistName),
    artistsSort: artistName,
    year: bi.year || 0,
    genres: bi.genres || [],
    styles: bi.styles || [],
    coverImage: bi.cover_image || bi.thumb || "",
    labels: bi.labels?.map((l) => l.name) || [],
    format: bi.formats?.[0]?.name || "",
    dateAdded: item.date_added || 0,
  };
}

function normalizeDetail(detail, album) {
  const tracklist = (detail.tracklist || [])
    .filter((t) => !t.type_ || t.type_ === "track")
    .map((t) => ({
      pos: t.position,
      title: t.title,
      dur: t.duration || "",
      extraartists: t.extraartists || [],
    }));
  const images = detail.images || [];
  return {
    ...album,
    id: album.releaseId || album.id,
    title: detail.albumTitle || album.title,
    artist: cleanArtistName(detail.albumArtist || album.artist),
    year: detail.year || album.year,
    country: detail.country || "",
    genres: detail.genres || album.genres || [],
    styles: detail.styles || album.styles || [],
    notes: detail.notes || "",
    videos: detail.videos || [],
    community: detail.community || {},
    rating: detail.community?.rating?.average || 0,
    ratingCount: detail.community?.rating?.count || 0,
    identifiers: detail.identifiers || [],
    masterId: detail.masterId || null,
    numForSale: detail.numForSale ?? 0,
    lowestPrice: detail.lowestPrice ?? null,
    formats: detail.formats || [],
    labelsDetailed: detail.labels || [],
    labels: detail.labels?.map((l) => l.name) || album.labels || [],
    credits: detail.extraartists || [],
    images,
    coverImage: images[0]?.uri || album.coverImage || "",
    tracks: tracklist,
  };
}

// ─── Glyphs ───────────────────────────────────────────────────────────────

const EmptyCrateGlyph = ({ color }) => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <rect x="6" y="14" width="44" height="34" stroke={color} strokeWidth="1.2" />
    <line x1="6" y1="14" x2="14" y2="6" stroke={color} strokeWidth="1.2" />
    <line x1="50" y1="14" x2="42" y2="6" stroke={color} strokeWidth="1.2" />
    <line x1="14" y1="6" x2="42" y2="6" stroke={color} strokeWidth="1.2" />
    <line x1="14" y1="22" x2="14" y2="42" stroke={color} strokeWidth="0.7" strokeDasharray="2 3" />
    <line x1="22" y1="22" x2="22" y2="42" stroke={color} strokeWidth="0.7" strokeDasharray="2 3" />
    <line x1="30" y1="22" x2="30" y2="42" stroke={color} strokeWidth="0.7" strokeDasharray="2 3" />
  </svg>
);

const NoResultsGlyph = ({ color }) => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <circle cx="22" cy="22" r="14" stroke={color} strokeWidth="1.2" />
    <line x1="32" y1="32" x2="46" y2="46" stroke={color} strokeWidth="1.5" />
  </svg>
);

const PlayIcon = ({ size = 10, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill={color}>
    <polygon points="2,1 9,5 2,9" />
  </svg>
);

const Spinner = ({ size = 12, color }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ animation: "crate-spin 0.8s linear infinite" }}>
    <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="1.5" />
    <path d="M 8 2 A 6 6 0 0 1 14 8" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─── Sleeve ───────────────────────────────────────────────────────────────
// Renders a real cover image, with placeholder fallback.

const Sleeve = ({ album, size = 300 }) => {
  const url = album.coverImage ? imgUrl(album.coverImage) : null;
  return (
    <div style={{
      width: size, height: size, background: "#111",
      overflow: "hidden", position: "relative", display: "block",
    }}>
      {url ? (
        <img
          src={url}
          alt={album.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 12, gap: 6, color: "#666", textAlign: "center",
        }}>
          <div style={{ fontSize: Math.max(10, size * 0.07), fontFamily: "var(--ui)", lineHeight: 1.3 }}>
            {album.title}
          </div>
          <div style={{ fontSize: Math.max(8, size * 0.055), fontFamily: "var(--mono)", letterSpacing: "0.08em", opacity: 0.7 }}>
            {album.artist.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SpinningDisc ─────────────────────────────────────────────────────────

const SpinningDisc = ({ album, spinning = true }) => (
  <svg viewBox="0 0 360 360" width="100%" height="100%" style={{
    display: "block",
    animation: spinning ? "crate-spin 4s linear infinite" : "none",
  }}>
    <circle cx="180" cy="180" r="178" fill="#0a0a0a" />
    {[...Array(45)].map((_, i) => (
      <circle key={i} cx="180" cy="180" r={86 + i * 2.05}
        fill="none" stroke={i % 4 === 0 ? "#222" : "#161616"} strokeWidth="0.4" />
    ))}
    <circle cx="180" cy="180" r="82" fill="#1a1614" />
    <text x="180" y="170" textAnchor="middle" fill="#c8b89a"
      fontFamily="'Cormorant Garamond', serif" fontSize="11" fontStyle="italic">
      {(album.title || "").slice(0, 24)}
    </text>
    <text x="180" y="186" textAnchor="middle" fill="#8a7a66"
      fontFamily="'JetBrains Mono', monospace" fontSize="5.5" letterSpacing="1.2">
      {(album.artist || "").toUpperCase().slice(0, 30)}
    </text>
    <text x="180" y="200" textAnchor="middle" fill="#5a4f44"
      fontFamily="'JetBrains Mono', monospace" fontSize="4.5" letterSpacing="1">
      SIDE A · 33⅓ RPM
    </text>
    <circle cx="180" cy="180" r="3" fill="#0a0a0a" />
  </svg>
);

// ─── Cover (sleeve ↔ disc toggle) ─────────────────────────────────────────

const Cover = ({ album, initial = "sleeve", spinning = true, hint = true }) => {
  const [mode, setMode] = useState(initial);
  useEffect(() => { setMode(initial); }, [album.id]);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); setMode((m) => (m === "sleeve" ? "disc" : "sleeve")); }}
      style={{ cursor: "pointer", width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: mode === "sleeve" ? 1 : 0, transition: "opacity 280ms ease" }}>
        <Sleeve album={album} size={400} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: mode === "disc" ? 1 : 0, transition: "opacity 280ms ease" }}>
        <SpinningDisc album={album} spinning={spinning && mode === "disc"} />
      </div>
      {hint && (
        <div style={{
          position: "absolute", bottom: 6, right: 6,
          width: 22, height: 22, borderRadius: "50%",
          background: "rgba(0,0,0,0.55)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0.55, fontSize: 11, pointerEvents: "none",
          backdropFilter: "blur(4px)",
        }}>
          {mode === "sleeve" ? "◉" : "▣"}
        </div>
      )}
    </div>
  );
};

// ─── Waveform / seekbar ───────────────────────────────────────────────────

const Waveform = ({ progress, accent, dim, n = 60 }) => {
  const bars = useMemo(() => {
    const out = [];
    let h = 1;
    for (let i = 0; i < n; i++) {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      out.push(0.3 + Math.pow(h / 0x7fffffff, 1.5) * 0.7);
    }
    return out;
  }, [n]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 22, flex: 1 }}>
      {bars.map((v, i) => (
        <div key={i} style={{
          width: 2, height: `${v * 100}%`,
          background: i / n < progress ? accent : dim,
          borderRadius: 1, transition: "background 60ms linear",
        }} />
      ))}
    </div>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────

const EmptyState = ({ icon, title, sub, theme, feel, action }) => (
  <div style={{
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: 40, textAlign: "center", gap: 14,
    background: theme.bg,
  }}>
    <div style={{ color: theme.inkDim }}>{icon}</div>
    <h3 style={{
      fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
      fontSize: feel.titleSerif ? 28 : 20,
      fontStyle: feel.titleSerif ? "italic" : "normal",
      fontWeight: feel.titleSerif ? 500 : 600,
      margin: 0, color: theme.ink,
    }}>{title}</h3>
    <p style={{ maxWidth: 380, color: theme.inkMuted, fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>{sub}</p>
    {action}
  </div>
);

// ─── SegControl ───────────────────────────────────────────────────────────

const SegControl = ({ options, value, onChange, theme, feel, iconOnly = false }) => (
  <div style={{
    display: "flex", background: theme.surface,
    border: `0.5px solid ${theme.hairline}`, borderRadius: 4, padding: 2, gap: 2,
  }}>
    {options.map((opt) => {
      const sel = opt.v === value;
      return (
        <button key={opt.v} onClick={() => onChange(opt.v)} style={{
          border: 0, background: sel ? theme.accent : "transparent",
          color: sel ? theme.accentInk : theme.inkMuted,
          padding: iconOnly ? "4px 8px" : "4px 10px", borderRadius: 3, cursor: "pointer",
          fontFamily: feel.uppercase ? "var(--mono)" : "var(--ui)",
          fontSize: feel.uppercase ? 10 : 11.5,
          letterSpacing: feel.uppercase ? "0.10em" : "0.01em",
          textTransform: feel.uppercase ? "uppercase" : "none",
          fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
        }}>
          {opt.icon === "grid" && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="4" height="4" stroke="currentColor" />
              <rect x="7" y="1" width="4" height="4" stroke="currentColor" />
              <rect x="1" y="7" width="4" height="4" stroke="currentColor" />
              <rect x="7" y="7" width="4" height="4" stroke="currentColor" />
            </svg>
          )}
          {opt.icon === "flip" && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="2" y1="2" x2="2" y2="10" stroke="currentColor" />
              <line x1="5" y1="2" x2="5" y2="10" stroke="currentColor" />
              <line x1="8" y1="2" x2="8" y2="10" stroke="currentColor" />
              <line x1="11" y1="2" x2="11" y2="10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
          {!iconOnly && opt.l}
        </button>
      );
    })}
  </div>
);

// ─── Header ───────────────────────────────────────────────────────────────

const Header = ({ t, theme, feel, count, view, setView, search, setSearch, sort, setSort, syncing, syncCount, onOpenSettings, onForceSync, narrow }) => (
  <header style={{
    padding: narrow ? "12px 16px 10px" : "14px 22px 12px",
    borderBottom: `0.5px solid ${theme.hairline}`,
    display: "flex", flexDirection: "column", gap: 10,
    background: theme.bg, flexShrink: 0,
  }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
      <div style={{
        fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
        fontSize: narrow ? 20 : 24, fontWeight: feel.titleSerif ? 500 : 600,
        letterSpacing: feel.titleSerif ? "0.01em" : "-0.01em",
        color: theme.ink, fontStyle: feel.titleSerif ? "italic" : "normal",
      }}>Crate</div>
      {!narrow && count > 0 && (
        <div style={{
          fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.10em",
          color: theme.inkMuted, textTransform: "uppercase", paddingBottom: 1,
        }}>
          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count).padStart(3, "0")} {t.records}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <button onClick={!syncing ? onForceSync : undefined} style={{
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em",
        color: theme.inkMuted, textTransform: "uppercase",
        background: "transparent", border: "none", cursor: syncing ? "default" : "pointer",
        padding: "2px 4px",
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: syncing ? theme.accent : theme.inkDim,
          boxShadow: syncing ? `0 0 8px ${theme.accent}` : "none",
          animation: syncing ? "crate-pulse 1.4s ease-in-out infinite" : "none",
        }} />
        {!narrow && (syncing
          ? (syncCount > 0 ? `${syncCount} ${t.syncing_records}` : t.sync)
          : t.sync_done
        )}
      </button>
      {onOpenSettings && (
        <button onClick={onOpenSettings} style={{
          width: 30, height: 30, borderRadius: 4,
          background: "transparent", border: `0.5px solid ${theme.hairline}`,
          color: theme.inkMuted, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = theme.ink; e.currentTarget.style.borderColor = theme.hairlineStrong; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = theme.inkMuted; e.currentTarget.style.borderColor = theme.hairline; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1" />
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
            <line x1="7" y1="1" x2="7" y2="2.5" stroke="currentColor" strokeWidth="1" />
            <line x1="7" y1="13" x2="7" y2="11.5" stroke="currentColor" strokeWidth="1" />
            <line x1="1" y1="7" x2="2.5" y2="7" stroke="currentColor" strokeWidth="1" />
            <line x1="13" y1="7" x2="11.5" y2="7" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      )}
    </div>

    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: narrow ? "wrap" : "nowrap" }}>
      <div style={{
        flex: narrow ? "1 1 100%" : 1,
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 12px",
        background: theme.surface, border: `0.5px solid ${theme.hairline}`, borderRadius: 4,
      }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke={theme.inkMuted} strokeWidth="1" />
          <line x1="11" y1="11" x2="14" y2="14" stroke={theme.inkMuted} strokeWidth="1" />
        </svg>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          style={{
            flex: 1, background: "transparent", border: 0, outline: 0,
            color: theme.ink, fontFamily: "var(--ui)", fontSize: 12.5,
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{
            background: "transparent", border: 0, color: theme.inkMuted,
            cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1,
          }}>×</button>
        )}
      </div>

      {!narrow && (
        <SegControl
          options={[
            { v: "added", l: t.sort_added },
            { v: "artist", l: t.sort_artist },
            { v: "title", l: t.sort_title },
            { v: "year", l: t.sort_year },
          ]}
          value={sort} onChange={setSort} theme={theme} feel={feel}
        />
      )}

      <SegControl
        options={[
          { v: "flip", l: t.view_flip, icon: "flip" },
          { v: "grid", l: t.view_grid, icon: "grid" },
        ]}
        value={view} onChange={setView} theme={theme} feel={feel} iconOnly
      />
    </div>
  </header>
);

// ─── FlipThrough ──────────────────────────────────────────────────────────

const NavArrow = ({ side, onClick, theme, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    position: "absolute", top: "50%", [side]: 16,
    transform: "translateY(-50%)",
    width: 44, height: 44, borderRadius: "50%",
    background: theme.surface, border: `0.5px solid ${theme.hairline}`,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.3 : 1,
    color: theme.ink, display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 200,
  }}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{ transform: side === "left" ? "rotate(180deg)" : "none" }}>
      <path d="M4 2 L10 7 L4 12" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  </button>
);

const FlipThrough = ({ albums, focused, setFocused, onOpen, theme, feel, density, t, reflection, narrow }) => {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(700);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sleeveSize = Math.min(
    Math.round(containerHeight * (narrow ? 0.52 : 0.62)),
    narrow ? 320 : 680
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e) => {
      e.preventDefault();
      acc += e.deltaX + e.deltaY;
      if (Math.abs(acc) > 30) {
        const delta = acc > 0 ? 1 : -1;
        setFocused((f) => Math.max(0, Math.min(albums.length - 1, f + delta)));
        acc = 0;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [albums.length, setFocused]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight") setFocused((f) => Math.min(albums.length - 1, f + 1));
      if (e.key === "ArrowLeft") setFocused((f) => Math.max(0, f - 1));
      if (e.key === "Enter" && albums[focused]) onOpen(albums[focused]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [albums, focused, onOpen, setFocused]);

  const focusedAlbum = albums[Math.min(focused, albums.length - 1)];
  if (!focusedAlbum) return null;

  return (
    <div ref={containerRef} style={{
      flex: 1, position: "relative", overflow: "hidden", background: theme.bg,
      backgroundImage: `linear-gradient(180deg, transparent 60%, ${theme.surface} 100%)`,
    }}>
      <div style={{
        position: "absolute", top: "46%", left: "50%",
        transform: "translate(-50%, -50%)",
        height: sleeveSize, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        perspective: 1400, perspectiveOrigin: "50% 50%",
      }}>
        <div style={{ position: "relative", height: sleeveSize, width: 1, transformStyle: "preserve-3d" }}>
          {albums.map((album, i) => {
            const offset = i - focused;
            const abs = Math.abs(offset);
            if (abs > 5) return null;
            const sign = Math.sign(offset);
            // safeX: inner edge of neighbour aligns exactly with focused cover's edge
            const rotRad = 55 * Math.PI / 180;
            const safeX = Math.ceil((sleeveSize / 2) * (1 + Math.cos(rotRad)));
            const x = abs === 0 ? 0 : sign * (safeX + (abs - 1) * Math.round(sleeveSize * 0.30));
            const z = -abs * 70;
            const rotY = abs === 0 ? 0 : -sign * 55;
            const scale = abs === 0 ? 1 : Math.max(0.78, 0.94 - (abs - 1) * 0.04);
            return (
              <div
                key={album.id}
                onClick={() => { if (i === focused) onOpen(album); else setFocused(i); }}
                style={{
                  position: "absolute",
                  width: sleeveSize, height: sleeveSize,
                  left: -sleeveSize / 2, top: 0,
                  transform: `translate3d(${x}px,0,${z}px) rotateY(${rotY}deg) scale(${scale})`,
                  transition: "transform 360ms cubic-bezier(.2,.7,.2,1), opacity 240ms",
                  cursor: "pointer",
                  opacity: abs > 5 ? 0 : 1,
                  zIndex: 100 - abs,
                  boxShadow: abs === 0
                    ? "0 30px 60px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.4)"
                    : "0 12px 24px rgba(0,0,0,0.4)",
                }}
              >
                <Sleeve album={album} size={sleeveSize} />
                {reflection && abs === 0 && (
                  <div style={{
                    position: "absolute", left: 0, top: "100%", width: "100%", height: "60%",
                    transform: "scaleY(-1)", transformOrigin: "top",
                    pointerEvents: "none", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      backgroundImage: `linear-gradient(180deg, ${theme.bg}66, ${theme.bg} 80%)`,
                      zIndex: 1,
                    }} />
                    <div style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
                      <Sleeve album={album} size={sleeveSize} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Counter — top center */}
      <div style={{
        position: "absolute", top: 16, left: 0, right: 0,
        display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 150,
      }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 10, color: theme.inkMuted,
          letterSpacing: "0.16em", textTransform: "uppercase",
        }}>
          <span style={{ color: theme.accent }}>●</span>{" "}
          {String(focused + 1).padStart(3, "0")}
          <span style={{ color: theme.inkDim }}> / {String(albums.length).padStart(3, "0")}</span>
        </div>
      </div>

      {/* Metadata strip — bottom */}
      <div style={{
        position: "absolute", bottom: 36, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
        textAlign: "center", pointerEvents: "none", zIndex: 150,
        background: `linear-gradient(transparent, ${theme.bg}cc 40%)`,
        paddingTop: 32, paddingBottom: 8,
      }}>
        <div style={{
          fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
          fontSize: feel.titleSerif ? 28 : 20,
          fontWeight: feel.titleSerif ? 500 : 600,
          fontStyle: feel.titleSerif ? "italic" : "normal",
          color: theme.ink, letterSpacing: feel.titleSerif ? "0.005em" : "-0.01em",
          lineHeight: 1.15, padding: "0 24px",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          maxWidth: "80vw",
        }}>
          {focusedAlbum.title}
        </div>
        <div style={{
          fontFamily: "var(--ui)", fontSize: 13, color: theme.inkMuted,
          letterSpacing: "0.03em",
        }}>
          {focusedAlbum.artist}
          {focusedAlbum.year > 0 && (
            <><span style={{ color: theme.inkDim, margin: "0 6px" }}>·</span>{focusedAlbum.year}</>
          )}
          {focusedAlbum.genres.length > 0 && (
            <><span style={{ color: theme.inkDim, margin: "0 6px" }}>·</span>{focusedAlbum.genres[0]}</>
          )}
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
        fontFamily: "var(--mono)", fontSize: 9, color: theme.inkDim,
        letterSpacing: "0.18em", textTransform: "uppercase", pointerEvents: "none",
      }}>
        ← → flip · click to open
      </div>

      <NavArrow side="left" onClick={() => setFocused((f) => Math.max(0, f - 1))} theme={theme} disabled={focused === 0} />
      <NavArrow side="right" onClick={() => setFocused((f) => Math.min(albums.length - 1, f + 1))} theme={theme} disabled={focused === albums.length - 1} />
    </div>
  );
};

// ─── GridView (virtualized) ───────────────────────────────────────────────

const GridView = ({ albums, onOpen, theme, feel, density }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleHeight, setVisibleHeight] = useState(800);

  const minSleeve = density === "tight" ? 96 : density === "spacious" ? 160 : 125;
  const gap = density === "tight" ? 8 : density === "spacious" ? 22 : 14;
  const padX = 22;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
      setVisibleHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cols = Math.max(1, Math.floor((containerWidth - padX * 2 + gap) / (minSleeve + gap)));
  const cellW = (containerWidth - padX * 2 - gap * (cols - 1)) / cols;
  const rowH = cellW + 42;
  const rowCount = Math.ceil(albums.length / cols);
  const overscan = 4;
  const startRow = Math.max(0, Math.floor(scrollTop / rowH) - overscan);
  const endRow = Math.min(rowCount, Math.ceil((scrollTop + visibleHeight) / rowH) + overscan);

  const visible = [];
  for (let r = startRow; r < endRow; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= albums.length) break;
      visible.push({ album: albums[idx], row: r, col: c });
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{ flex: 1, overflow: "auto", background: theme.bg, padding: `20px ${padX}px`, position: "relative" }}
    >
      <div style={{ position: "relative", height: rowCount * rowH, width: "100%" }}>
        {visible.map(({ album, row, col }) => (
          <div
            key={album.id}
            onClick={() => onOpen(album)}
            style={{
              position: "absolute",
              left: col * (cellW + gap),
              top: row * rowH,
              width: cellW, cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 8,
            }}
          >
            <div
              style={{
                width: cellW, height: cellW,
                boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
                overflow: "hidden", transition: "transform 200ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
            >
              <Sleeve album={album} size={cellW} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minHeight: 38 }}>
              <div style={{
                fontFamily: "var(--ui)", fontSize: 12, color: theme.ink, fontWeight: 500,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{album.title}</div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: 10, color: theme.inkMuted,
                letterSpacing: "0.06em", textTransform: "uppercase",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {album.artist}{album.year > 0 ? ` · ${album.year}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── RecordModal ──────────────────────────────────────────────────────────

const Meta = ({ label, value, theme }) => (
  <div>
    <div style={{
      fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.12em",
      color: theme.inkDim, textTransform: "uppercase", marginBottom: 4,
    }}>{label}</div>
    <div style={{ fontFamily: "var(--ui)", fontSize: 14, color: theme.ink }}>{value}</div>
  </div>
);

const RecordModal = ({ album: baseAlbum, token, t, theme, feel, onClose, onPlay, narrow }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => { loadDetail(); }, [baseAlbum.releaseId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function loadDetail() {
    setLoading(true);
    setImgIdx(0);
    try {
      const res = await fetch(API + `/discogs/tracklist/${baseAlbum.releaseId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setDetail(normalizeDetail(data, baseAlbum));
    } catch {
      setDetail(normalizeDetail({}, baseAlbum));
    }
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch(API + `/discogs/refreshRelease/${baseAlbum.releaseId}`, {
        method: "POST", headers: { Authorization: "Bearer " + token },
      });
      await loadDetail();
    } catch {}
    setRefreshing(false);
  }

  const album = detail || baseAlbum;
  const images = detail?.images?.filter((i) => i.uri) || (baseAlbum.coverImage ? [{ uri: baseAlbum.coverImage }] : []);

  // Group tracks by side
  const sides = useMemo(() => {
    if (!detail?.tracks?.length) return [];
    const groups = {};
    detail.tracks.forEach((tr) => {
      const side = (tr.pos || "?").match(/^([A-Z]+)/)?.[1] || "?";
      if (!groups[side]) groups[side] = [];
      groups[side].push(tr);
    });
    return Object.entries(groups);
  }, [detail]);

  async function scrobbleAndPlay(sideTracks, startIdx) {
    const artist = album.artist;
    const albumTitle = album.title;
    // Call scrobble API with timestamps
    try {
      const tracksForApi = sideTracks.map((t) => ({
        ...t,
        duration: t.dur,
      }));
      const withTs = computeTimestamps(tracksForApi);
      await fetch(API + "/lastfm/scrobble", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          tracks: withTs.map((tr) => ({
            artist,
            track: tr.title,
            album: albumTitle,
            duration: parseDuration(tr.dur || ""),
            timestamp: tr.timestamp,
          })),
        }),
      });
    } catch {}
    onPlay({ album, sideTracks, startIdx });
  }

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 500,
      background: "rgba(0,0,0,0.62)", backdropFilter: "blur(8px)",
      animation: "crate-fadein 200ms ease-out",
      display: "flex", alignItems: "stretch", justifyContent: "center",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        position: "relative",
        margin: narrow ? 0 : "30px 30px 100px",
        background: theme.surface,
        border: narrow ? 0 : `0.5px solid ${theme.hairlineStrong}`,
        boxShadow: narrow ? "none" : "0 40px 80px rgba(0,0,0,0.6)",
        display: "flex", flexDirection: narrow ? "column" : "row",
        overflow: narrow ? "auto" : "hidden",
        flex: 1, maxWidth: narrow ? "none" : 1180, width: "100%",
        animation: "crate-slideup 280ms cubic-bezier(.2,.7,.2,1)",
      }}>
        {/* Left: image */}
        <div style={{
          flex: narrow ? "0 0 auto" : "0 0 44%",
          background: theme.bg,
          padding: narrow ? "20px 20px 16px" : 36,
          display: "flex", flexDirection: narrow ? "row" : "column",
          alignItems: "center", gap: narrow ? 14 : 18,
          borderRight: narrow ? 0 : `0.5px solid ${theme.hairline}`,
          borderBottom: narrow ? `0.5px solid ${theme.hairline}` : 0,
        }}>
          <div style={{
            width: narrow ? "40%" : "100%",
            flex: narrow ? "0 0 40%" : "none",
            aspectRatio: "1/1", position: "relative",
            boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
            overflow: "hidden", background: "#111",
          }}>
            {images.length > 0 ? (
              <img
                src={imgUrl(images[imgIdx]?.uri || "")}
                alt={album.title}
                style={{ width: "100%", height: "100%", objectFit: "contain", background: "#111", display: "block" }}
              />
            ) : loading ? (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Spinner size={24} color={theme.inkDim} />
              </div>
            ) : (
              <Sleeve album={baseAlbum} size={400} />
            )}
          </div>

          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: narrow ? "flex-start" : "center",
            gap: 14, flex: narrow ? 1 : "none",
            width: narrow ? "auto" : "100%",
          }}>
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} style={{
                    width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3,
                    background: i === imgIdx ? theme.accent : theme.hairlineStrong,
                    border: 0, cursor: "pointer",
                    transition: "width 180ms, background 180ms",
                  }} />
                ))}
              </div>
            )}
            {detail?.tracks?.length > 0 && (
              <button onClick={() => scrobbleAndPlay(detail.tracks, 0)} style={{
                width: narrow ? "auto" : "100%", padding: "12px 16px",
                background: theme.accent, color: theme.accentInk,
                border: 0, cursor: "pointer",
                fontFamily: feel.uppercase ? "var(--mono)" : "var(--ui)",
                fontSize: feel.uppercase ? 12 : 14,
                letterSpacing: feel.uppercase ? "0.14em" : "0.02em",
                textTransform: feel.uppercase ? "uppercase" : "none",
                fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
                <PlayIcon size={11} color={theme.accentInk} />
                {t.play_album}
              </button>
            )}
            <button onClick={handleRefresh} disabled={refreshing} style={{
              padding: "8px 14px", border: `0.5px solid ${theme.hairline}`,
              background: "transparent", color: theme.inkMuted, cursor: refreshing ? "default" : "pointer",
              fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.10em",
              textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8,
            }}>
              {refreshing ? <Spinner size={10} color={theme.inkMuted} /> : (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6 a4 4 0 0 1 7-2.5 M10 6 a4 4 0 0 1 -7 2.5" stroke="currentColor" strokeWidth="1" />
                  <polyline points="9,1 9,3.5 6.5,3.5" stroke="currentColor" strokeWidth="1" fill="none" />
                  <polyline points="3,11 3,8.5 5.5,8.5" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
              )}
              {t.update_release}
            </button>
          </div>
        </div>

        {/* Right: info + tracklist */}
        <div style={{
          flex: 1, overflowY: narrow ? "visible" : "auto",
          padding: narrow ? "24px 20px 28px" : "32px 36px 36px",
          display: "flex", flexDirection: "column", gap: 18,
        }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position: "absolute", top: 12, right: 12,
            width: 28, height: 28, borderRadius: 14,
            border: 0, background: "transparent", color: theme.inkMuted,
            cursor: "pointer", fontSize: 18, zIndex: 10,
          }}>×</button>

          {loading ? (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 16, padding: 40,
            }}>
              <Spinner size={28} color={theme.accent} />
              <div style={{
                fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em",
                color: theme.inkMuted, textTransform: "uppercase",
              }}>{t.loading}</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div>
                <h1 style={{
                  fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
                  fontSize: feel.titleSerif ? 40 : 32,
                  fontWeight: feel.titleSerif ? 500 : 700,
                  fontStyle: feel.titleSerif ? "italic" : "normal",
                  letterSpacing: feel.titleSerif ? "0.005em" : "-0.02em",
                  color: theme.ink, margin: "0 0 6px", lineHeight: 1.05,
                }}>{album.title}</h1>
                <div style={{ fontFamily: "var(--ui)", fontSize: 18, color: theme.inkMuted }}>{album.artist}</div>
              </div>

              {/* Meta grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "12px 24px", padding: "16px 0",
                borderTop: `0.5px solid ${theme.hairline}`,
                borderBottom: `0.5px solid ${theme.hairline}`,
              }}>
                {album.year > 0 && <Meta label="Year" value={album.year} theme={theme} />}
                {album.country && <Meta label={t.country} value={album.country} theme={theme} />}
                {album.labelsDetailed?.length > 0 && (
                  <Meta label="Label" value={
                    <span>
                      {album.labelsDetailed.map((l, i) => (
                        <span key={i}>
                          {i > 0 && <span style={{ color: theme.inkDim }}>, </span>}
                          {l.name}
                          {l.catno && l.catno !== "none" && (
                            <span style={{ color: theme.inkDim, fontSize: 11 }}> · {l.catno}</span>
                          )}
                        </span>
                      ))}
                    </span>
                  } theme={theme} />
                )}
                {album.formats?.length > 0 && (
                  <Meta label="Format" value={
                    album.formats.map((f) =>
                      [f.name, ...(f.descriptions || []), f.text].filter(Boolean).join(", ")
                    ).join(" · ")
                  } theme={theme} />
                )}
                {album.genres?.length > 0 && <Meta label={t.genres} value={album.genres.join(" · ")} theme={theme} />}
                {album.styles?.length > 0 && <Meta label={t.styles} value={album.styles.join(" · ")} theme={theme} />}
                {album.community?.have != null && (
                  <Meta label="Have / Want" value={
                    <span>
                      <span style={{ color: theme.ink }}>{album.community.have || 0}</span>
                      <span style={{ color: theme.inkDim }}> / </span>
                      <span style={{ color: theme.accent }}>{album.community.want || 0}</span>
                    </span>
                  } theme={theme} />
                )}
                {album.rating > 0 && (
                  <Meta label={t.rating} value={
                    <span>
                      <span style={{ color: theme.accent }}>{album.rating.toFixed(2)}</span>
                      <span style={{ color: theme.inkDim, fontSize: 10, marginLeft: 6 }}>/ 5 · {album.ratingCount} ratings</span>
                    </span>
                  } theme={theme} />
                )}
                {(album.numForSale > 0 || album.lowestPrice != null) && (
                  <Meta label="For Sale" value={
                    <span>
                      {album.numForSale > 0 && <span style={{ color: theme.ink }}>{album.numForSale} copies</span>}
                      {album.lowestPrice != null && (
                        <><span style={{ color: theme.inkDim }}>{album.numForSale > 0 ? " · " : ""}from </span><span style={{ color: theme.accent }}>€{Number(album.lowestPrice).toFixed(2)}</span></>
                      )}
                    </span>
                  } theme={theme} />
                )}
              </div>

              {/* Credits / Personnel */}
              {album.credits?.length > 0 && (
                <div>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em",
                    color: theme.inkMuted, textTransform: "uppercase", marginBottom: 10,
                  }}>Credits</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {(() => {
                      const byRole = {};
                      album.credits.forEach((c) => {
                        const role = c.role || "Other";
                        if (!byRole[role]) byRole[role] = [];
                        byRole[role].push(cleanArtistName(c.name));
                      });
                      return Object.entries(byRole).map(([role, names]) => (
                        <div key={role} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                          <div style={{
                            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em",
                            color: theme.inkDim, textTransform: "uppercase",
                            flex: "0 0 130px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>{role}</div>
                          <div style={{ fontFamily: "var(--ui)", fontSize: 13.5, color: theme.ink }}>
                            {names.join(", ")}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {album.notes && (
                <div style={{
                  fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
                  fontSize: feel.titleSerif ? 16 : 13,
                  fontStyle: feel.titleSerif ? "italic" : "normal",
                  color: theme.inkMuted, lineHeight: 1.5,
                  borderLeft: `2px solid ${theme.accent}`, paddingLeft: 14,
                }}>"{album.notes}"</div>
              )}

              {/* Tracklist */}
              {sides.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {sides.map(([side, tracks]) => (
                    <div key={side}>
                      <div style={{
                        display: "flex", alignItems: "baseline", justifyContent: "space-between",
                        marginBottom: 8,
                      }}>
                        <div style={{
                          fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.14em",
                          color: theme.ink, textTransform: "uppercase", fontWeight: 600,
                        }}>{t.side} {side}</div>
                        <button onClick={() => scrobbleAndPlay(tracks, 0)} style={{
                          background: "transparent", border: `0.5px solid ${theme.hairline}`,
                          color: theme.inkMuted, padding: "4px 10px",
                          fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.10em",
                          textTransform: "uppercase", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <PlayIcon size={9} />
                          {t.play_side} {side}
                        </button>
                      </div>
                      <div>
                        {tracks.map((tr, i) => (
                          <div key={i}
                            style={{
                              display: "grid", gridTemplateColumns: "36px 1fr auto auto",
                              gap: 10, alignItems: "center", padding: "7px 8px",
                              borderBottom: i < tracks.length - 1 ? `0.5px solid ${theme.hairline}` : "none",
                              cursor: "pointer", transition: "background 120ms",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = theme.surface2; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            onClick={() => scrobbleAndPlay(tracks, i)}
                          >
                            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: theme.inkDim, letterSpacing: "0.05em" }}>{tr.pos}</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                              <span style={{ fontFamily: "var(--ui)", fontSize: 14.5, color: theme.ink }}>{tr.title}</span>
                              {tr.extraartists?.length > 0 && (
                                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: theme.inkDim, letterSpacing: "0.04em" }}>
                                  {tr.extraartists.map((ea, k) => (
                                    <span key={k}>{k > 0 ? " · " : ""}{ea.role}: <span style={{ color: theme.inkMuted }}>{cleanArtistName(ea.name)}</span></span>
                                  ))}
                                </span>
                              )}
                            </div>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: theme.inkMuted }}>{tr.dur}</span>
                            <PlayIcon size={11} color={theme.accent} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}


              {/* Videos */}
              {album.videos?.length > 0 && (
                <div>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.14em",
                    color: theme.inkMuted, textTransform: "uppercase", marginBottom: 10,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <rect width="14" height="10" rx="2" fill={theme.accent} opacity="0.85" />
                      <polygon points="5.5,3 5.5,7 9,5" fill={theme.surface} />
                    </svg>
                    {t.videos} <span style={{ color: theme.inkDim }}>({album.videos.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {album.videos.map((v, i) => (
                      <a key={i} href={v.uri} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "grid", gridTemplateColumns: "20px 1fr auto", gap: 10,
                          alignItems: "center", padding: "9px 0",
                          borderTop: `0.5px solid ${theme.hairline}`,
                          color: theme.ink, textDecoration: "none",
                          fontFamily: "var(--ui)", fontSize: 14,
                        }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill={theme.accent}>
                          <polygon points="5,3.5 5,10.5 11,7" />
                        </svg>
                        <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{v.title}</span>
                        {v.duration && <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: theme.inkMuted }}>{v.duration}</span>}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── NowPlayingBar ────────────────────────────────────────────────────────

const CtrlBtn = ({ children, onClick, theme, accent }) => (
  <button onClick={onClick} style={{
    width: 30, height: 30, borderRadius: "50%",
    border: accent ? 0 : `0.5px solid ${theme.hairlineStrong}`,
    background: accent ? theme.accent : "transparent",
    color: accent ? theme.accentInk : theme.ink,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  }}>{children}</button>
);

const NowPlayingBar = ({ playing, token, t, theme, feel, npStyle, onClose }) => {
  const { album, sideTracks, startIdx } = playing;
  const [trackIdx, setTrackIdx] = useState(startIdx);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { setTrackIdx(startIdx); setElapsed(0); }, [album.id, startIdx]);

  const current = sideTracks[trackIdx];
  const total = parseDuration(current?.dur || "");

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= total) {
          if (trackIdx + 1 < sideTracks.length) {
            setTrackIdx((i) => i + 1);
            return 0;
          }
          setPaused(true);
          return total;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused, total, trackIdx, sideTracks.length]);

  // Post now-playing on track change
  useEffect(() => {
    if (!current) return;
    fetch(API + "/lastfm/nowPlaying", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({
        artist: album.artist, track: current.title, album: album.title,
        duration: parseDuration(current.dur || ""),
      }),
    }).catch(() => {});
  }, [trackIdx]);

  const progress = total > 0 ? elapsed / total : 0;

  if (npStyle === "expanded") {
    return <NowPlayingExpanded playing={playing} current={current} trackIdx={trackIdx}
      setTrackIdx={setTrackIdx} elapsed={elapsed} setElapsed={setElapsed}
      total={total} progress={progress} paused={paused} setPaused={setPaused}
      t={t} theme={theme} feel={feel} onClose={onClose} />;
  }

  if (npStyle === "side") {
    return <NowPlayingSide playing={playing} current={current} trackIdx={trackIdx}
      setTrackIdx={setTrackIdx} elapsed={elapsed} setElapsed={setElapsed}
      total={total} progress={progress} paused={paused} setPaused={setPaused}
      t={t} theme={theme} feel={feel} onClose={onClose} />;
  }

  // Default: bottom bar
  if (!current) return null;
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: 64,
      background: theme.surface, borderTop: `0.5px solid ${theme.hairlineStrong}`,
      display: "flex", alignItems: "center", gap: 16, padding: "0 16px",
      zIndex: 400, animation: "crate-slideup 240ms cubic-bezier(.2,.7,.2,1)",
    }}>
      <div style={{ width: 48, height: 48, flex: "0 0 auto", boxShadow: "0 2px 6px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <Cover album={album} initial="sleeve" spinning={!paused} hint={false} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: "0 0 220px" }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 9.5, color: theme.accent,
          letterSpacing: "0.10em", textTransform: "uppercase",
        }}>{current.pos} · {t.now_playing}</div>
        <div style={{
          fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
          fontSize: feel.titleSerif ? 15 : 13, color: theme.ink,
          fontWeight: feel.titleSerif ? 500 : 600,
          fontStyle: feel.titleSerif ? "italic" : "normal",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{current.title}</div>
        <div style={{
          fontFamily: "var(--ui)", fontSize: 10.5, color: theme.inkMuted,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{album.artist} — {album.title}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <CtrlBtn theme={theme} onClick={() => { setTrackIdx(Math.max(0, trackIdx - 1)); setElapsed(0); }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <polygon points="8,1 8,9 3,5" /><rect x="1" y="1" width="1" height="8" />
          </svg>
        </CtrlBtn>
        <CtrlBtn theme={theme} accent onClick={() => setPaused(!paused)}>
          {paused
            ? <PlayIcon size={10} color={theme.accentInk} />
            : <svg width="9" height="10" viewBox="0 0 9 10" fill={theme.accentInk}>
                <rect x="1" y="1" width="2.5" height="8" /><rect x="5.5" y="1" width="2.5" height="8" />
              </svg>
          }
        </CtrlBtn>
        <CtrlBtn theme={theme} onClick={() => {
          if (trackIdx + 1 < sideTracks.length) { setTrackIdx(trackIdx + 1); setElapsed(0); }
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <polygon points="2,1 2,9 7,5" /><rect x="8" y="1" width="1" height="8" />
          </svg>
        </CtrlBtn>
      </div>

      <Waveform progress={progress} accent={theme.accent} dim={theme.hairlineStrong} />

      <div style={{
        fontFamily: "var(--mono)", fontSize: 10.5, color: theme.inkMuted,
        letterSpacing: "0.04em", minWidth: 90, textAlign: "right",
      }}>
        <span style={{ color: theme.ink }}>{fmtDur(elapsed)}</span>
        <span style={{ color: theme.inkDim }}> / {fmtDur(total)}</span>
      </div>

      <button onClick={onClose} style={{
        border: 0, background: "transparent", color: theme.inkMuted,
        cursor: "pointer", fontSize: 18, padding: 4,
      }}>×</button>
    </div>
  );
};

const NowPlayingExpanded = ({ playing, current, trackIdx, setTrackIdx, elapsed, setElapsed, total, progress, paused, setPaused, t, theme, feel, onClose }) => {
  const { album, sideTracks } = playing;
  const [showSleeve, setShowSleeve] = useState(false);
  useEffect(() => { setShowSleeve(false); }, [album.id]);

  if (!current) return null;
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 400,
      background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.surface} 100%)`,
      display: "flex", flexDirection: "column",
      animation: "crate-fadein 320ms ease-out",
    }}>
      <div style={{
        padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `0.5px solid ${theme.hairline}`,
      }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em",
          color: theme.inkMuted, textTransform: "uppercase",
        }}>● {t.now_playing}</div>
        <button onClick={onClose} style={{
          background: "transparent", border: `0.5px solid ${theme.hairline}`,
          padding: "6px 12px", color: theme.inkMuted, cursor: "pointer",
          fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "0.10em",
          textTransform: "uppercase",
        }}>{t.close}</button>
      </div>

      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 50, padding: 40, flexWrap: "wrap",
      }}>
        <div onClick={() => setShowSleeve((s) => !s)}
          style={{ position: "relative", width: 320, height: 320, cursor: "pointer", flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: 0, opacity: showSleeve ? 0 : 1, transition: "opacity 320ms" }}>
            <SpinningDisc album={album} spinning={!paused && !showSleeve} />
          </div>
          <div style={{
            position: "absolute", inset: 0, opacity: showSleeve ? 1 : 0,
            transition: "opacity 320ms",
            boxShadow: showSleeve ? "0 24px 60px rgba(0,0,0,0.6)" : "none",
            overflow: "hidden",
          }}>
            <Sleeve album={album} size={320} />
          </div>
          {/* Tonearm */}
          <div style={{
            position: "absolute", top: -12, right: -16, width: 160, height: 160,
            pointerEvents: "none",
            transform: `rotate(${20 + progress * 18}deg)`,
            transformOrigin: "top right",
            transition: "transform 1s linear, opacity 280ms",
            opacity: showSleeve ? 0 : 1,
          }}>
            <svg viewBox="0 0 160 160">
              <circle cx="152" cy="8" r="5" fill={theme.surface} stroke={theme.hairlineStrong} />
              <line x1="152" y1="8" x2="36" y2="108" stroke={theme.inkMuted} strokeWidth="2.5" />
              <rect x="28" y="104" width="12" height="9" fill={theme.surface2} stroke={theme.hairlineStrong} />
            </svg>
          </div>
        </div>

        <div style={{ flex: "0 0 320px", display: "flex", flexDirection: "column", gap: 16, minWidth: 280 }}>
          <div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 10, color: theme.accent,
              letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8,
            }}>{current.pos} · {t.side} {current.pos?.charAt(0)}</div>
            <h2 style={{
              fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
              fontSize: feel.titleSerif ? 36 : 26,
              fontWeight: feel.titleSerif ? 500 : 600,
              fontStyle: feel.titleSerif ? "italic" : "normal",
              letterSpacing: feel.titleSerif ? "0.005em" : "-0.02em",
              color: theme.ink, margin: "0 0 8px", lineHeight: 1.1,
            }}>{current.title}</h2>
            <div style={{ fontFamily: "var(--ui)", fontSize: 14, color: theme.inkMuted }}>
              {album.artist} — {album.title}
            </div>
          </div>

          <Waveform progress={progress} accent={theme.accent} dim={theme.hairlineStrong} n={80} />

          <div style={{
            display: "flex", justifyContent: "space-between",
            fontFamily: "var(--mono)", fontSize: 11, color: theme.inkMuted, letterSpacing: "0.04em",
          }}>
            <span style={{ color: theme.ink }}>{fmtDur(elapsed)}</span>
            <span>−{fmtDur(total - elapsed)}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <CtrlBtn theme={theme} onClick={() => { setTrackIdx(Math.max(0, trackIdx - 1)); setElapsed(0); }}>
              <svg width="11" height="11" viewBox="0 0 10 10" fill="currentColor"><polygon points="8,1 8,9 3,5" /><rect x="1" y="1" width="1" height="8" /></svg>
            </CtrlBtn>
            <button onClick={() => setPaused(!paused)} style={{
              width: 56, height: 56, borderRadius: "50%",
              background: theme.accent, color: theme.accentInk,
              border: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {paused
                ? <PlayIcon size={16} color={theme.accentInk} />
                : <svg width="14" height="16" viewBox="0 0 14 16" fill={theme.accentInk}>
                    <rect x="2" y="2" width="3.5" height="12" /><rect x="8.5" y="2" width="3.5" height="12" />
                  </svg>
              }
            </button>
            <CtrlBtn theme={theme} onClick={() => {
              if (trackIdx + 1 < sideTracks.length) { setTrackIdx(trackIdx + 1); setElapsed(0); }
            }}>
              <svg width="11" height="11" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 2,9 7,5" /><rect x="8" y="1" width="1" height="8" /></svg>
            </CtrlBtn>
          </div>

          <div style={{ padding: "12px 0", borderTop: `0.5px solid ${theme.hairline}`, maxHeight: 130, overflow: "auto" }}>
            {sideTracks.map((tr, i) => (
              <div key={i} onClick={() => { setTrackIdx(i); setElapsed(0); }} style={{
                display: "flex", gap: 10, padding: "5px 0", cursor: "pointer",
                color: i === trackIdx ? theme.accent : theme.inkMuted,
                fontSize: 12, fontFamily: "var(--ui)",
              }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, minWidth: 24 }}>{tr.pos}</span>
                <span style={{ flex: 1 }}>{tr.title}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{tr.dur}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const NowPlayingSide = ({ playing, current, trackIdx, setTrackIdx, elapsed, setElapsed, total, progress, paused, setPaused, t, theme, feel, onClose }) => {
  const { album, sideTracks } = playing;
  if (!current) return null;
  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0,
      width: 300, background: theme.surface,
      borderLeft: `0.5px solid ${theme.hairlineStrong}`,
      display: "flex", flexDirection: "column", zIndex: 400,
      animation: "crate-slidein-right 260ms cubic-bezier(.2,.7,.2,1)",
      boxShadow: "-10px 0 30px rgba(0,0,0,0.3)",
    }}>
      <div style={{
        padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `0.5px solid ${theme.hairline}`,
      }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "0.18em",
          color: theme.accent, textTransform: "uppercase",
        }}>● {t.now_playing}</div>
        <button onClick={onClose} style={{
          background: "transparent", border: 0, color: theme.inkMuted, cursor: "pointer", fontSize: 18,
        }}>×</button>
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ aspectRatio: "1/1", boxShadow: "0 16px 36px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <Cover album={album} initial="sleeve" spinning={!paused} hint={false} />
        </div>
        <div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 9.5, color: theme.accent,
            letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4,
          }}>{current.pos}</div>
          <h3 style={{
            fontFamily: feel.titleSerif ? "var(--display)" : "var(--ui)",
            fontSize: feel.titleSerif ? 20 : 17,
            fontWeight: feel.titleSerif ? 500 : 600,
            fontStyle: feel.titleSerif ? "italic" : "normal",
            margin: 0, color: theme.ink, lineHeight: 1.15,
          }}>{current.title}</h3>
          <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: theme.inkMuted, marginTop: 3 }}>
            {album.artist}
          </div>
        </div>
        <Waveform progress={progress} accent={theme.accent} dim={theme.hairlineStrong} n={50} />
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: "var(--mono)", fontSize: 10, color: theme.inkMuted,
        }}>
          <span style={{ color: theme.ink }}>{fmtDur(elapsed)}</span>
          <span>{fmtDur(total)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <CtrlBtn theme={theme} onClick={() => { setTrackIdx(Math.max(0, trackIdx - 1)); setElapsed(0); }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="8,1 8,9 3,5" /><rect x="1" y="1" width="1" height="8" /></svg>
          </CtrlBtn>
          <button onClick={() => setPaused(!paused)} style={{
            width: 44, height: 44, borderRadius: "50%",
            background: theme.accent, border: 0, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {paused
              ? <PlayIcon size={12} color={theme.accentInk} />
              : <svg width="11" height="12" viewBox="0 0 11 12" fill={theme.accentInk}>
                  <rect x="1" y="1" width="3" height="10" /><rect x="7" y="1" width="3" height="10" />
                </svg>
            }
          </button>
          <CtrlBtn theme={theme} onClick={() => {
            if (trackIdx + 1 < sideTracks.length) { setTrackIdx(trackIdx + 1); setElapsed(0); }
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 2,9 7,5" /><rect x="8" y="1" width="1" height="8" /></svg>
          </CtrlBtn>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "0 18px 18px" }}>
        {sideTracks.map((tr, i) => (
          <div key={i} onClick={() => { setTrackIdx(i); setElapsed(0); }} style={{
            display: "flex", gap: 8, padding: "6px 0", cursor: "pointer",
            borderTop: i > 0 ? `0.5px solid ${theme.hairline}` : "none",
            color: i === trackIdx ? theme.accent : theme.ink,
            fontSize: 12, fontFamily: "var(--ui)",
          }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, minWidth: 22, color: theme.inkDim }}>{tr.pos}</span>
            <span style={{ flex: 1 }}>{tr.title}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: theme.inkDim }}>{tr.dur}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Collection component ────────────────────────────────────────────

export default function Collection({ token, prefs, onOpenSettings, onLogout }) {
  const dirSpec = DIRECTIONS[prefs.direction] || DIRECTIONS.paper;
  const theme = prefs.dark ? dirSpec.dark : dirSpec.light;
  const feel = dirSpec.feel;
  const t = I18N[prefs.language] || I18N.en;
  const typePair = TYPE_PAIRINGS[prefs.typePairing] || TYPE_PAIRINGS.classic;

  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("added");
  const [view, setView] = useState("flip");
  const [focused, setFocused] = useState(0);
  const [open, setOpen] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [width, setWidth] = useState(1280);
  const rootRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = width < 720;
  const effectiveNpStyle = narrow ? "bar" : prefs.nowPlayingStyle;

  function authFetch(url, opts = {}) {
    return fetch(API + url, { ...opts, headers: { ...opts?.headers, Authorization: "Bearer " + token } });
  }

  const loadCollection = useCallback(async () => {
    const [colRes, statusRes] = await Promise.all([
      authFetch("/discogs/collection"),
      authFetch("/syncStatus"),
    ]);
    const data = await colRes.json();
    const status = await statusRes.json();
    setCollection(Array.isArray(data) ? data.map(normalizeAlbum) : []);
    setSyncing(status.running || status.queued > 0);
    setSyncCount(status.queued || 0);
    setLoading(false);
    return status;
  }, [token]);

  async function triggerSync(force = false) {
    await authFetch("/syncCollection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    }).catch(() => {});
    async function poll() {
      const status = await loadCollection();
      if (status.running || status.queued > 0) {
        pollRef.current = setTimeout(poll, 3000);
      }
    }
    poll();
  }

  useEffect(() => {
    triggerSync(false);
    return () => { clearTimeout(pollRef.current); };
  }, [token]);

  const albums = useMemo(() => {
    const q = search.toLowerCase();
    let list = q
      ? collection.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q))
      : collection;
    return [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "year") return (b.year || 0) - (a.year || 0);
      if (sort === "artist") return (a.artistsSort || a.artist).localeCompare(b.artistsSort || b.artist);
      // "added" — newest first
      return (b.dateAdded || 0) - (a.dateAdded || 0);
    });
  }, [collection, search, sort]);

  const isEmpty = !loading && collection.length === 0;
  const isNoResults = !loading && collection.length > 0 && albums.length === 0 && search.length > 0;

  const cssVars = {
    "--display": typePair.display,
    "--ui": typePair.ui,
    "--mono": typePair.mono,
  };

  return (
    <div ref={rootRef} style={{
      width: "100%", height: "100%",
      background: theme.bg, color: theme.ink,
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
      fontFamily: typePair.ui,
      ...cssVars,
    }}>
      <Header
        t={t} theme={theme} feel={feel}
        count={collection.length} view={view} setView={setView}
        search={search} setSearch={setSearch}
        sort={sort} setSort={setSort}
        syncing={syncing} syncCount={syncCount}
        onOpenSettings={onOpenSettings}
        onForceSync={() => triggerSync(true)}
        narrow={narrow}
      />

      {loading ? (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          background: theme.bg,
        }}>
          <svg width="28" height="28" viewBox="0 0 16 16" style={{ animation: "crate-spin 0.8s linear infinite" }}>
            <circle cx="8" cy="8" r="6" fill="none" stroke={theme.accent} strokeOpacity="0.3" strokeWidth="1.5" />
            <path d="M 8 2 A 6 6 0 0 1 14 8" fill="none" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.14em", color: theme.inkMuted, textTransform: "uppercase" }}>
            {t.loading}
          </div>
        </div>
      ) : isEmpty ? (
        <EmptyState
          theme={theme} feel={feel}
          icon={<EmptyCrateGlyph color={theme.inkDim} />}
          title={t.empty_collection_title}
          sub={t.empty_collection_sub}
        />
      ) : isNoResults ? (
        <EmptyState
          theme={theme} feel={feel}
          icon={<NoResultsGlyph color={theme.inkDim} />}
          title={t.no_results_title}
          sub={t.no_results_sub}
        />
      ) : view === "flip" ? (
        <FlipThrough
          albums={albums}
          focused={Math.min(focused, albums.length - 1)}
          setFocused={setFocused}
          onOpen={setOpen}
          theme={theme} feel={feel} density={prefs.density}
          t={t} reflection={prefs.reflection} narrow={narrow}
        />
      ) : (
        <GridView albums={albums} onOpen={setOpen} theme={theme} feel={feel} density={prefs.density} />
      )}

      {open && (
        <RecordModal
          album={open} token={token}
          t={t} theme={theme} feel={feel}
          narrow={narrow}
          onClose={() => setOpen(null)}
          onPlay={(p) => { setPlaying(p); setOpen(null); }}
        />
      )}

      {playing && (
        <NowPlayingBar
          playing={playing} token={token}
          t={t} theme={theme} feel={feel}
          npStyle={effectiveNpStyle}
          onClose={() => setPlaying(null)}
        />
      )}

      {/* Film grain overlay */}
      {theme.grain > 0 && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          opacity: theme.grain, mixBlendMode: "overlay",
          backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.9\' numOctaves=\'2\'/></filter><rect width=\'200\' height=\'200\' filter=\'url(%23n)\'/></svg>")',
        }} />
      )}
    </div>
  );
}
