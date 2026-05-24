// CrateApp — main interactive prototype. Takes theme/tweak props.
//
// Screens:
//  - Collection: flip-through (Cover Flow style) + grid toggle
//  - Record detail modal (overlay, pulls a record from the crate)
//  - Now-playing bar at the bottom (style varies)

const { useState, useEffect, useMemo, useRef, useCallback } = React;

const fmtDur = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};
const parseDur = (str) => {
  if (!str) return 210;
  const [m, s] = str.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
};

// Empty-state glyphs — simple geometric placeholders, no real iconography
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
const OfflineGlyph = ({ color }) => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="22" stroke={color} strokeWidth="1.2" />
    <line x1="12" y1="12" x2="44" y2="44" stroke={color} strokeWidth="2" />
  </svg>
);
const NoResultsGlyph = ({ color }) => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <circle cx="22" cy="22" r="14" stroke={color} strokeWidth="1.2" />
    <line x1="32" y1="32" x2="46" y2="46" stroke={color} strokeWidth="1.5" />
  </svg>
);

// Audio-feeling waveform/seekbar bars — purely visual
const Waveform = ({ progress, accent, dim, n = 60 }) => {
  const bars = useMemo(() => {
    const out = [];
    // deterministic pseudo-random pattern
    let h = 1;
    for (let i = 0; i < n; i++) {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const norm = (h / 0x7fffffff);
      // weighted to mid-heights with occasional peaks
      const v = 0.3 + Math.pow(norm, 1.5) * 0.7;
      out.push(v);
    }
    return out;
  }, [n]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 22, flex: 1 }}>
      {bars.map((v, i) => {
        const filled = i / n < progress;
        return (
          <div key={i} style={{
            width: 2, height: `${v * 100}%`,
            background: filled ? accent : dim,
            borderRadius: 1,
            transition: 'background 60ms linear',
          }} />
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Header — search + sort + view toggle + sync status + settings
const Header = ({ t, theme, feel, count, view, setView, search, setSearch, sort, setSort, syncing, onOpenSettings, narrow }) => {
  return (
    <header style={{
      padding: narrow ? '12px 16px 10px' : '14px 22px 12px',
      borderBottom: `0.5px solid ${theme.hairline}`,
      display: 'flex', flexDirection: 'column', gap: 10,
      background: theme.bg,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <div style={{
          fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
          fontSize: narrow ? 20 : 24, fontWeight: feel.titleSerif ? 500 : 600,
          letterSpacing: feel.titleSerif ? '0.01em' : '-0.01em',
          color: theme.ink,
          fontStyle: feel.titleSerif ? 'italic' : 'normal',
        }}>{t.appName}</div>
        {!narrow && (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.10em',
            color: theme.inkMuted, textTransform: 'uppercase', paddingBottom: 1,
          }}>
            {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count).padStart(3, '0')} {t.records}
          </div>
        )}
        <div style={{ flex: 1 }} />
        {/* Sync status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em',
            color: theme.inkMuted, textTransform: 'uppercase' }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: syncing ? theme.accent : theme.inkDim,
            boxShadow: syncing ? `0 0 8px ${theme.accent}` : 'none',
            animation: syncing ? 'crate-pulse 1.4s ease-in-out infinite' : 'none',
          }} />
          {!narrow && (syncing ? t.sync : t.sync_done)}
        </div>
        {onOpenSettings && (
          <button onClick={onOpenSettings} style={{
            width: 30, height: 30, borderRadius: 4,
            background: 'transparent', border: `0.5px solid ${theme.hairline}`,
            color: theme.inkMuted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 120ms, color 120ms',
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

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: narrow ? 'wrap' : 'nowrap' }}>
        {/* Search */}
        <div style={{
          flex: narrow ? '1 1 100%' : 1,
          order: narrow ? 0 : 0,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          background: theme.surface, border: `0.5px solid ${theme.hairline}`,
          borderRadius: 4,
        }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke={theme.inkMuted} strokeWidth="1" />
            <line x1="11" y1="11" x2="14" y2="14" stroke={theme.inkMuted} strokeWidth="1" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 0,
              color: theme.ink, fontFamily: 'var(--ui)', fontSize: 12.5,
            }}
          />
        </div>

        {/* Sort */}
        {!narrow && (
          <SegControl
            options={[
              { v: 'artist', l: t.sort_artist },
              { v: 'title', l: t.sort_title },
              { v: 'year', l: t.sort_year },
            ]}
            value={sort} onChange={setSort} theme={theme} feel={feel}
          />
        )}
        {narrow && (
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{
            flex: 1,
            padding: '8px 10px', borderRadius: 4,
            background: theme.surface, color: theme.ink,
            border: `0.5px solid ${theme.hairline}`,
            fontFamily: 'var(--ui)', fontSize: 12.5,
          }}>
            <option value="artist">{t.sort_artist}</option>
            <option value="title">{t.sort_title}</option>
            <option value="year">{t.sort_year}</option>
          </select>
        )}

        {/* View */}
        <SegControl
          options={[
            { v: 'flip', l: t.view_flip, icon: 'flip' },
            { v: 'grid', l: t.view_grid, icon: 'grid' },
          ]}
          value={view} onChange={setView} theme={theme} feel={feel}
          iconOnly
        />
      </div>
    </header>
  );
};

const SegControl = ({ options, value, onChange, theme, feel, iconOnly = false }) => (
  <div style={{
    display: 'flex',
    background: theme.surface,
    border: `0.5px solid ${theme.hairline}`,
    borderRadius: 4, padding: 2, gap: 2,
  }}>
    {options.map((opt) => {
      const sel = opt.v === value;
      return (
        <button
          key={opt.v}
          onClick={() => onChange(opt.v)}
          style={{
            border: 0, background: sel ? theme.accent : 'transparent',
            color: sel ? theme.accentInk : theme.inkMuted,
            padding: iconOnly ? '4px 8px' : '4px 10px',
            borderRadius: 3, cursor: 'pointer',
            fontFamily: feel.uppercase ? 'var(--mono)' : 'var(--ui)',
            fontSize: feel.uppercase ? 10 : 11.5,
            letterSpacing: feel.uppercase ? '0.10em' : '0.01em',
            textTransform: feel.uppercase ? 'uppercase' : 'none',
            fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {opt.icon === 'grid' && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="4" height="4" stroke="currentColor" />
              <rect x="7" y="1" width="4" height="4" stroke="currentColor" />
              <rect x="1" y="7" width="4" height="4" stroke="currentColor" />
              <rect x="7" y="7" width="4" height="4" stroke="currentColor" />
            </svg>
          )}
          {opt.icon === 'flip' && (
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

// ─────────────────────────────────────────────────────────────────────────
// Cover — flippable between sleeve and spinning disc. Click toggles.
const SpinningDisc = ({ album, spinning = true }) => (
  <svg viewBox="0 0 360 360" width="100%" height="100%" style={{
    display: 'block',
    animation: spinning ? 'crate-spin 4s linear infinite' : 'none',
  }}>
    <circle cx="180" cy="180" r="178" fill="#0a0a0a" />
    <circle cx="180" cy="180" r="178" fill="none" stroke="#1a1a1a" strokeWidth="1" />
    {[...Array(45)].map((_, i) => (
      <circle key={i} cx="180" cy="180" r={86 + i * 2.05}
        fill="none" stroke={i % 4 === 0 ? "#222" : "#161616"} strokeWidth="0.4" />
    ))}
    <circle cx="180" cy="180" r="82" fill={album.palette[2]} />
    <circle cx="180" cy="180" r="82" fill="none" stroke={album.palette[0]} strokeOpacity="0.2" strokeWidth="0.5" />
    <text x="180" y="158" textAnchor="middle" fill={album.palette[0]}
      fontFamily="'Cormorant Garamond', serif" fontSize="13" fontStyle="italic">
      {album.title}
    </text>
    <text x="180" y="178" textAnchor="middle" fill={album.palette[0]} opacity="0.75"
      fontFamily="'JetBrains Mono', monospace" fontSize="6.5" letterSpacing="1.4">
      {album.artist.toUpperCase()}
    </text>
    <text x="180" y="196" textAnchor="middle" fill={album.palette[0]} opacity="0.55"
      fontFamily="'JetBrains Mono', monospace" fontSize="5" letterSpacing="1.2">
      SIDE A · 33⅓ RPM
    </text>
    <text x="180" y="222" textAnchor="middle" fill={album.palette[0]} opacity="0.45"
      fontFamily="'JetBrains Mono', monospace" fontSize="4.5" letterSpacing="1.4">
      {(album.labelsDetailed?.[0]?.catno || '').toUpperCase()}
    </text>
    <circle cx="180" cy="180" r="3" fill="#0a0a0a" />
  </svg>
);

const Cover = ({ album, initial = 'sleeve', spinning = true, theme, hint = true }) => {
  const [mode, setMode] = useState(initial);
  useEffect(() => { setMode(initial); }, [album.id, initial]);
  const toggle = (e) => {
    e.stopPropagation();
    setMode((m) => (m === 'sleeve' ? 'disc' : 'sleeve'));
  };
  return (
    <div onClick={toggle} style={{
      cursor: 'pointer', width: '100%', height: '100%', position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        opacity: mode === 'sleeve' ? 1 : 0,
        transition: 'opacity 280ms ease',
      }}>
        <Sleeve album={album} size={400} />
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        opacity: mode === 'disc' ? 1 : 0,
        transition: 'opacity 280ms ease',
      }}>
        <SpinningDisc album={album} spinning={spinning && mode === 'disc'} />
      </div>
      {hint && (
        <div style={{
          position: 'absolute', bottom: 6, right: 6,
          width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.55, fontSize: 11, pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
        }}>
          {mode === 'sleeve' ? '◉' : '▣'}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Flip-through (Cover Flow style)
const FlipThrough = ({ albums, focused, setFocused, onOpen, theme, feel, density, t, reflection = false, narrow = false }) => {
  const containerRef = useRef(null);
  const baseSize = density === 'tight' ? 260 : density === 'spacious' ? 340 : 300;
  const sleeveSize = narrow ? Math.min(baseSize, 220) : baseSize;
  const gap = density === 'tight' ? 8 : density === 'spacious' ? 28 : 16;

  // Handle wheel / drag for navigation
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
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [albums.length, setFocused]);

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') setFocused((f) => Math.min(albums.length - 1, f + 1));
      if (e.key === 'ArrowLeft') setFocused((f) => Math.max(0, f - 1));
      if (e.key === 'Enter') onOpen(albums[focused]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [albums, focused, onOpen, setFocused]);

  const focusedAlbum = albums[focused];

  return (
    <div ref={containerRef} style={{
      flex: 1, position: 'relative', overflow: 'hidden',
      background: theme.bg,
      // subtle horizontal floor reflection
      backgroundImage: `linear-gradient(180deg, transparent 60%, ${theme.surface} 100%)`,
    }}>
      {/* The crate */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        height: sleeveSize, width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        perspective: 1400, perspectiveOrigin: '50% 50%',
      }}>
        <div style={{
          position: 'relative', height: sleeveSize, width: 1,
          transformStyle: 'preserve-3d',
        }}>
          {albums.map((album, i) => {
            const offset = i - focused;
            const abs = Math.abs(offset);
            const sign = Math.sign(offset);
            // Out-of-view culling
            if (abs > 6) return null;
            // Positioning
            const x = sign * Math.min(abs, 6) * (sleeveSize * 0.28) + sign * (abs > 0 ? 60 : 0);
            const z = -abs * 80;
            // Inner edge swings backward (away from viewer) so off-axis sleeves
            // can't stick through the focused one. iTunes Cover Flow convention.
            const rotY = abs === 0 ? 0 : -sign * 55;
            const scale = abs === 0 ? 1 : 0.92;
            const opacity = abs > 5 ? 0 : 1;
            return (
              <div
                key={album.id}
                onClick={() => {
                  if (i === focused) onOpen(album);
                  else setFocused(i);
                }}
                style={{
                  position: 'absolute',
                  width: sleeveSize, height: sleeveSize,
                  left: -sleeveSize / 2, top: 0,
                  transform: `translate3d(${x}px,0,${z}px) rotateY(${rotY}deg) scale(${scale})`,
                  transition: 'transform 360ms cubic-bezier(.2,.7,.2,1), opacity 240ms',
                  cursor: 'pointer',
                  opacity,
                  zIndex: 100 - abs,
                  boxShadow: abs === 0
                    ? '0 30px 60px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.4)'
                    : '0 12px 24px rgba(0,0,0,0.4)',
                }}
              >
                <Sleeve album={album} size={sleeveSize} />
                {reflection && (
                  <div style={{
                    position: 'absolute', left: 0, top: '100%', width: '100%', height: '60%',
                    transform: 'scaleY(-1)', transformOrigin: 'top',
                    background: `linear-gradient(180deg, transparent, ${theme.bg} 90%)`,
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `linear-gradient(180deg, ${theme.bg}66, ${theme.bg} 80%)`,
                    }} />
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
                      <Sleeve album={album} size={sleeveSize} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Focused album metadata strip — pinned to top */}
      <div style={{
        position: 'absolute', top: 16, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        textAlign: 'center', pointerEvents: 'none', zIndex: 150,
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: theme.inkMuted,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          <span style={{ color: theme.accent }}>●</span> {String(focused + 1).padStart(3, '0')}
          <span style={{ color: theme.inkDim }}> / {String(albums.length).padStart(3, '0')}</span>
        </div>
        <div style={{
          fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
          fontSize: feel.titleSerif ? 30 : 22,
          fontWeight: feel.titleSerif ? 500 : 600,
          fontStyle: feel.titleSerif ? 'italic' : 'normal',
          color: theme.ink, letterSpacing: feel.titleSerif ? '0.005em' : '-0.01em',
          lineHeight: 1.15, padding: '0 24px',
          whiteSpace: 'nowrap',
        }}>
          {focusedAlbum?.title}
        </div>
        <div style={{
          fontFamily: 'var(--ui)', fontSize: 12.5, color: theme.inkMuted,
          letterSpacing: '0.04em', padding: '0 24px',
          whiteSpace: 'nowrap',
        }}>
          {focusedAlbum?.artist} <span style={{ color: theme.inkDim, margin: '0 6px' }}>·</span>
          {focusedAlbum?.year} <span style={{ color: theme.inkDim, margin: '0 6px' }}>·</span>
          {focusedAlbum?.genres.join(', ')}
        </div>
      </div>

      {/* Hint — click to open */}
      <div style={{
        position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'var(--mono)', fontSize: 9.5, color: theme.inkDim,
        letterSpacing: '0.18em', textTransform: 'uppercase', pointerEvents: 'none',
      }}>
        ← → {t.records === 'plater' ? 'blar · klikk for å opne' : 'flip · click to open'}
      </div>

      {/* Side arrows */}
      <NavArrow side="left" onClick={() => setFocused((f) => Math.max(0, f - 1))} theme={theme} disabled={focused === 0} />
      <NavArrow side="right" onClick={() => setFocused((f) => Math.min(albums.length - 1, f + 1))} theme={theme} disabled={focused === albums.length - 1} />
    </div>
  );
};

const NavArrow = ({ side, onClick, theme, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      position: 'absolute', top: '50%', [side]: 16,
      transform: 'translateY(-50%)',
      width: 44, height: 44, borderRadius: '50%',
      background: theme.surface, border: `0.5px solid ${theme.hairline}`,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.3 : 1,
      color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
    }}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{
      transform: side === 'left' ? 'rotate(180deg)' : 'none',
    }}>
      <path d="M4 2 L10 7 L4 12" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────
// Grid view — windowed/virtualized so 1–20000 items all render smoothly
const GridView = ({ albums, onOpen, theme, feel, density }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [scrollTop, setScrollTop] = useState(0);

  const minSleeve = density === 'tight' ? 96 : density === 'spacious' ? 160 : 125;
  const gap = density === 'tight' ? 8 : density === 'spacious' ? 22 : 14;
  const padX = 22;

  // Track container width via ResizeObserver so column count adapts
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cols = Math.max(1, Math.floor((containerWidth - padX * 2 + gap) / (minSleeve + gap)));
  const cellW = (containerWidth - padX * 2 - gap * (cols - 1)) / cols;
  const rowH = cellW + 36; // sleeve + label rows
  const rowCount = Math.ceil(albums.length / cols);
  const overscan = 4;
  const startRow = Math.max(0, Math.floor(scrollTop / rowH) - overscan);
  const endRow = Math.min(rowCount, Math.ceil((scrollTop + 800) / rowH) + overscan);

  // Visible items
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
      style={{
        flex: 1, overflow: 'auto', background: theme.bg,
        padding: `20px ${padX}px`,
        position: 'relative',
      }}>
      <div style={{
        position: 'relative',
        height: rowCount * rowH,
        width: '100%',
      }}>
        {visible.map(({ album, row, col }) => {
          const left = col * (cellW + gap);
          const top = row * rowH;
          return (
            <div
              key={album.id}
              onClick={() => onOpen(album)}
              style={{
                position: 'absolute',
                left, top, width: cellW,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <div style={{
                width: cellW, height: cellW,
                boxShadow: '0 6px 14px rgba(0,0,0,0.4)',
                overflow: 'hidden',
                transition: 'transform 200ms',
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <Sleeve album={album} size={cellW} />
              </div>
              <div style={{ minHeight: 28 }}>
                <div style={{
                  fontFamily: 'var(--ui)', fontSize: 11.5, color: theme.ink,
                  fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{album.title}</div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 9.5, color: theme.inkMuted,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{album.artist}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Record Detail Modal — overlay over collection
const RecordModal = ({ album, t, theme, feel, onClose, onPlay, narrow = false }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const images = useMemo(() => [
    { type: 'front' }, { type: 'back' }, { type: 'label' },
  ], [album.id]);

  // Group tracks by side
  const sides = useMemo(() => {
    const groups = {};
    album.tracks.forEach((tr) => {
      const side = (tr.pos || '?').match(/^([A-Z]+)/)?.[1] || '?';
      if (!groups[side]) groups[side] = [];
      groups[side].push(tr);
    });
    return Object.entries(groups);
  }, [album.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.62)',
      backdropFilter: 'blur(8px)',
      animation: 'crate-fadein 200ms ease-out',
      display: 'flex',
      alignItems: 'stretch', justifyContent: 'center',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        position: 'relative',
        margin: narrow ? 0 : 30, marginBottom: narrow ? 0 : 100,
        background: theme.surface,
        border: narrow ? 0 : `0.5px solid ${theme.hairlineStrong}`,
        boxShadow: narrow ? 'none' : '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: narrow ? 'column' : 'row',
        overflow: narrow ? 'auto' : 'hidden',
        flex: 1, maxWidth: narrow ? 'none' : 1180, width: '100%',
        animation: 'crate-slideup 280ms cubic-bezier(.2,.7,.2,1)',
      }}>
        {/* Left (or top): sleeve carousel */}
        <div style={{
          flex: narrow ? '0 0 auto' : '0 0 46%',
          background: theme.bg,
          padding: narrow ? '20px 20px 16px' : 36,
          display: 'flex',
          flexDirection: narrow ? 'row' : 'column',
          alignItems: 'center', gap: narrow ? 14 : 18,
          borderRight: narrow ? 0 : `0.5px solid ${theme.hairline}`,
          borderBottom: narrow ? `0.5px solid ${theme.hairline}` : 0,
        }}>
          <div style={{
            width: narrow ? '40%' : '100%', flex: narrow ? '0 0 40%' : 'none',
            aspectRatio: '1/1', position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
          }}>
            {images[imgIdx].type === 'front' && <Sleeve album={album} size={400} />}
            {images[imgIdx].type === 'back' && <BackSleeve album={album} theme={theme} feel={feel} />}
            {images[imgIdx].type === 'label' && <LabelSleeve album={album} theme={theme} feel={feel} />}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: narrow ? 'column' : 'column',
            alignItems: narrow ? 'flex-start' : 'center',
            gap: 14,
            flex: narrow ? 1 : 'none',
            width: narrow ? 'auto' : '100%',
          }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)} style={{
                  width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === imgIdx ? theme.accent : theme.hairlineStrong,
                  border: 0, cursor: 'pointer',
                  transition: 'width 180ms, background 180ms',
                }} />
              ))}
            </div>
            <button style={{
              marginTop: narrow ? 0 : 'auto',
              padding: '8px 14px', border: `0.5px solid ${theme.hairline}`,
              background: 'transparent', color: theme.inkMuted, cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.10em',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 6 a4 4 0 0 1 7-2.5 M10 6 a4 4 0 0 1 -7 2.5"
                  stroke="currentColor" strokeWidth="1" />
                <polyline points="9,1 9,3.5 6.5,3.5" stroke="currentColor" strokeWidth="1" fill="none" />
                <polyline points="3,11 3,8.5 5.5,8.5" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
            {t.update_release}
            </button>
          </div>
        </div>

        {/* Right: info + tracklist */}
        <div style={{
          flex: 1, overflowY: narrow ? 'visible' : 'auto',
          padding: narrow ? '24px 20px 28px' : '32px 36px 36px',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12,
            width: 28, height: 28, borderRadius: 14,
            border: 0, background: 'transparent', color: theme.inkMuted,
            cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 14,
          }}>×</button>

          {/* Header */}
          <div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
              color: theme.accent, textTransform: 'uppercase', marginBottom: 8,
              display: 'flex', flexWrap: 'wrap', gap: '4px 10px',
            }}>
              <span>{album.labelsDetailed?.[0]?.name || album.labels[0]}</span>
              {album.labelsDetailed?.[0]?.catno && (
                <span style={{ color: theme.inkMuted }}>· {album.labelsDetailed[0].catno}</span>
              )}
              <span style={{ color: theme.inkMuted }}>· {album.formats?.[0]?.descriptions.join(', ') || album.format}</span>
              <span style={{ color: theme.inkMuted }}>· {album.year}</span>
            </div>
            <h1 style={{
              fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
              fontSize: feel.titleSerif ? 44 : 34,
              fontWeight: feel.titleSerif ? 500 : 700,
              fontStyle: feel.titleSerif ? 'italic' : 'normal',
              letterSpacing: feel.titleSerif ? '0.005em' : '-0.02em',
              color: theme.ink, margin: '0 0 6px', lineHeight: 1.05,
            }}>{album.title}</h1>
            <div style={{
              fontFamily: 'var(--ui)', fontSize: 16, color: theme.inkMuted,
              fontWeight: 400, letterSpacing: '0.01em',
            }}>{album.artist}</div>
          </div>

          {/* Meta grid — left: facts. Right: community */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '10px 24px',
            padding: '14px 0',
            borderTop: `0.5px solid ${theme.hairline}`,
            borderBottom: `0.5px solid ${theme.hairline}`,
          }}>
            <Meta label={t.country} value={album.country} theme={theme} />
            <Meta label="HAVE / WANT" value={
              <span>
                <span style={{ color: theme.ink }}>{album.community?.have || 0}</span>
                <span style={{ color: theme.inkDim }}> / </span>
                <span style={{ color: theme.accent }}>{album.community?.want || 0}</span>
              </span>
            } theme={theme} />
            <Meta label={t.genres} value={album.genres.join(' · ')} theme={theme} />
            <Meta label={t.rating} value={
              <span>
                <span style={{ color: theme.accent }}>{album.rating.toFixed(2)}</span>
                <span style={{ color: theme.inkDim, fontSize: 10, marginLeft: 6 }}>
                  / 5 · {album.ratingCount} {t.records === 'plater' ? 'vurderingar' : 'ratings'}
                </span>
              </span>
            } theme={theme} />
            <Meta label={t.styles} value={album.styles.join(' · ')} theme={theme} />
            {album.numForSale > 0 && (
              <Meta label={t.records === 'plater' ? 'TIL SAL' : 'FOR SALE'} value={
                <span>
                  <span style={{ color: theme.ink }}>{album.numForSale}</span>
                  <span style={{ color: theme.inkDim }}> · frå </span>
                  <span style={{ color: theme.ink }}>€{album.lowestPrice}</span>
                </span>
              } theme={theme} />
            )}
          </div>

          {album.notes && (
            <div style={{
              fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
              fontSize: feel.titleSerif ? 16 : 13,
              fontStyle: feel.titleSerif ? 'italic' : 'normal',
              color: theme.inkMuted, lineHeight: 1.5,
              borderLeft: `2px solid ${theme.accent}`,
              paddingLeft: 14,
            }}>"{album.notes}"</div>
          )}

          {/* Tracklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {sides.map(([side, tracks]) => (
              <div key={side}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em',
                    color: theme.ink, textTransform: 'uppercase', fontWeight: 600,
                  }}>
                    {t.side} {side}
                  </div>
                  <button onClick={() => onPlay({ album, sideTracks: tracks, startIdx: 0 })} style={{
                    background: 'transparent', border: `0.5px solid ${theme.hairline}`,
                    color: theme.inkMuted, padding: '4px 10px',
                    fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.10em',
                    textTransform: 'uppercase', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <PlayIcon size={9} />
                    {t.play_side} {side}
                  </button>
                </div>
                <div>
                  {tracks.map((tr, i) => (
                    <div key={i} style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr auto auto',
                      gap: 10, alignItems: 'center',
                      padding: '7px 8px',
                      borderBottom: i < tracks.length - 1 ? `0.5px solid ${theme.hairline}` : 'none',
                      transition: 'background 120ms',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = theme.surface2}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => onPlay({ album, sideTracks: tracks, startIdx: i })}
                    >
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 10.5, color: theme.inkDim,
                        letterSpacing: '0.05em',
                      }}>{tr.pos}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <span style={{
                          fontFamily: 'var(--ui)', fontSize: 13, color: theme.ink,
                        }}>{tr.title}</span>
                        {tr.extraartists?.length > 0 && (
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: 9.5, color: theme.inkDim,
                            letterSpacing: '0.04em',
                          }}>
                            {tr.extraartists.map((ea, k) => (
                              <span key={k}>{k > 0 ? ' · ' : ''}{ea.role}: <span style={{ color: theme.inkMuted }}>{ea.name}</span></span>
                            ))}
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 10.5, color: theme.inkMuted,
                      }}>{tr.dur}</span>
                      <PlayIcon size={11} color={theme.accent} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Whole album play */}
          <button
            onClick={() => onPlay({ album, sideTracks: album.tracks, startIdx: 0 })}
            style={{
              marginTop: 6, padding: '12px 16px',
              background: theme.accent, color: theme.accentInk,
              border: 0, cursor: 'pointer',
              fontFamily: feel.uppercase ? 'var(--mono)' : 'var(--ui)',
              fontSize: feel.uppercase ? 11 : 13,
              letterSpacing: feel.uppercase ? '0.14em' : '0.02em',
              textTransform: feel.uppercase ? 'uppercase' : 'none',
              fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
            <PlayIcon size={11} color={theme.accentInk} />
            {t.play_album}
          </button>

          {/* Videos */}
          {album.videos?.length > 0 && (
            <div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
                color: theme.inkMuted, textTransform: 'uppercase', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <rect width="14" height="10" rx="2" fill={theme.accent} opacity="0.85" />
                  <polygon points="5.5,3 5.5,7 9,5" fill={theme.surface} />
                </svg>
                {t.videos}
                <span style={{ color: theme.inkDim }}>({album.videos.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {album.videos.map((v, i) => (
                  <a key={i} href={v.uri} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10,
                      alignItems: 'center', padding: '8px 0',
                      borderTop: `0.5px solid ${theme.hairline}`,
                      color: theme.ink, textDecoration: 'none',
                      fontFamily: 'var(--ui)', fontSize: 12.5,
                    }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill={theme.accent}>
                      <polygon points="5,3.5 5,10.5 11,7" />
                    </svg>
                    <span style={{
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>{v.title}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: theme.inkMuted }}>{v.duration}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Identifiers + master link */}
          {(album.identifiers?.length > 0 || album.masterId) && (
            <div style={{
              padding: '14px 0 0',
              borderTop: `0.5px solid ${theme.hairline}`,
              display: 'flex', flexWrap: 'wrap', gap: '4px 18px',
              fontFamily: 'var(--mono)', fontSize: 9.5,
              letterSpacing: '0.08em', color: theme.inkDim,
            }}>
              {album.identifiers?.map((id, i) => (
                <span key={i}>
                  <span style={{ color: theme.inkMuted }}>{id.type.toUpperCase()}</span>
                  {' '}{id.value}
                </span>
              ))}
              {album.masterId && (
                <span>
                  <span style={{ color: theme.inkMuted }}>MASTER</span>
                  {' #'}{album.masterId}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Meta = ({ label, value, theme }) => (
  <div>
    <div style={{
      fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em',
      color: theme.inkDim, textTransform: 'uppercase', marginBottom: 3,
    }}>{label}</div>
    <div style={{ fontFamily: 'var(--ui)', fontSize: 13, color: theme.ink }}>
      {value}
    </div>
  </div>
);

const PlayIcon = ({ size = 10, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill={color}>
    <polygon points="2,1 9,5 2,9" />
  </svg>
);

// Back sleeve (printed tracklist look)
const BackSleeve = ({ album, theme, feel }) => {
  const [bg, ink, accent] = album.palette;
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ display: 'block' }}>
      <rect width="400" height="400" fill={bg} />
      <text x="200" y="40" textAnchor="middle" fill={ink} opacity="0.85"
        fontFamily="'Cormorant Garamond', serif" fontSize="22" fontStyle="italic">
        {album.title}
      </text>
      <text x="200" y="58" textAnchor="middle" fill={ink} opacity="0.55"
        fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="1.5">
        {album.artist.toUpperCase()}
      </text>
      <line x1="40" y1="78" x2="360" y2="78" stroke={ink} opacity="0.3" strokeWidth="0.5" />
      {album.tracks.slice(0, 12).map((tr, i) => (
        <g key={i}>
          <text x="40" y={100 + i * 18} fill={ink} opacity="0.7"
            fontFamily="'JetBrains Mono', monospace" fontSize="9">{tr.pos}</text>
          <text x="80" y={100 + i * 18} fill={ink} opacity="0.9"
            fontFamily="'Cormorant Garamond', serif" fontSize="12">{tr.title}</text>
          <text x="360" y={100 + i * 18} textAnchor="end" fill={ink} opacity="0.6"
            fontFamily="'JetBrains Mono', monospace" fontSize="9">{tr.dur}</text>
        </g>
      ))}
      <line x1="40" y1="340" x2="360" y2="340" stroke={accent} strokeWidth="0.5" />
      <text x="40" y="358" fill={ink} opacity="0.55"
        fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="1">
        {album.labels[0]?.toUpperCase()} · {album.year}
      </text>
      <text x="360" y="358" textAnchor="end" fill={accent}
        fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="1">
        SIDE A · SIDE B
      </text>
    </svg>
  );
};

// Spinning record label
const LabelSleeve = ({ album, theme, feel }) => {
  const [bg, ink, accent] = album.palette;
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ display: 'block' }}>
      <rect width="400" height="400" fill="#0a0a0a" />
      {/* concentric vinyl grooves */}
      {[...Array(30)].map((_, i) => (
        <circle key={i} cx="200" cy="200" r={70 + i * 4}
          fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
      ))}
      {/* label */}
      <circle cx="200" cy="200" r="80" fill={accent} />
      <text x="200" y="180" textAnchor="middle" fill={bg}
        fontFamily="'Cormorant Garamond', serif" fontSize="14" fontStyle="italic">
        {album.title}
      </text>
      <text x="200" y="200" textAnchor="middle" fill={bg} opacity="0.85"
        fontFamily="'JetBrains Mono', monospace" fontSize="7" letterSpacing="1.2">
        {album.artist.toUpperCase()}
      </text>
      <text x="200" y="218" textAnchor="middle" fill={bg} opacity="0.7"
        fontFamily="'JetBrains Mono', monospace" fontSize="6" letterSpacing="1">
        SIDE A · 33⅓ RPM
      </text>
      <text x="200" y="236" textAnchor="middle" fill={bg} opacity="0.6"
        fontFamily="'JetBrains Mono', monospace" fontSize="5.5" letterSpacing="1">
        {album.labels[0]?.toUpperCase()}
      </text>
      <circle cx="200" cy="200" r="3" fill="#0a0a0a" />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Now Playing bar — three styles
const NowPlayingBar = ({ playing, t, theme, feel, style, onClose, onTogglePlay, onNext, onPrev }) => {
  const { album, sideTracks, startIdx } = playing;
  const [trackIdx, setTrackIdx] = useState(startIdx);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { setTrackIdx(startIdx); setElapsed(0); }, [album.id, startIdx]);

  const current = sideTracks[trackIdx];
  const total = parseDur(current?.dur);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= total) {
          // Advance to next track
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

  const progress = elapsed / total;

  if (style === 'expanded') {
    return (
      <NowPlayingExpanded
        playing={playing} current={current} trackIdx={trackIdx} setTrackIdx={setTrackIdx}
        elapsed={elapsed} total={total} progress={progress} paused={paused} setPaused={setPaused}
        setElapsed={setElapsed}
        t={t} theme={theme} feel={feel} onClose={onClose}
      />
    );
  }

  if (style === 'side') {
    return (
      <NowPlayingSide
        playing={playing} current={current} trackIdx={trackIdx} setTrackIdx={setTrackIdx}
        elapsed={elapsed} total={total} progress={progress} paused={paused} setPaused={setPaused}
        setElapsed={setElapsed}
        t={t} theme={theme} feel={feel} onClose={onClose}
      />
    );
  }

  // Default: thin bottom bar
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 64,
      background: theme.surface,
      borderTop: `0.5px solid ${theme.hairlineStrong}`,
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px',
      zIndex: 400,
      animation: 'crate-slideup 240ms cubic-bezier(.2,.7,.2,1)',
    }}>
      <div style={{
        width: 48, height: 48, flex: '0 0 auto',
        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
      }}>
        <Cover album={album} initial="sleeve" spinning={!paused} theme={theme} hint={false} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 200, flex: '0 0 240px' }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9.5, color: theme.accent,
          letterSpacing: '0.10em', textTransform: 'uppercase',
        }}>
          {current.pos} · {t.now_playing}
        </div>
        <div style={{
          fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
          fontSize: feel.titleSerif ? 15 : 13, color: theme.ink,
          fontWeight: feel.titleSerif ? 500 : 600,
          fontStyle: feel.titleSerif ? 'italic' : 'normal',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{current.title}</div>
        <div style={{
          fontFamily: 'var(--ui)', fontSize: 10.5, color: theme.inkMuted,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{album.artist} — {album.title}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CtrlBtn theme={theme} onClick={() => { setTrackIdx(Math.max(0, trackIdx - 1)); setElapsed(0); }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="8,1 8,9 3,5" /><rect x="1" y="1" width="1" height="8" /></svg>
        </CtrlBtn>
        <CtrlBtn theme={theme} accent onClick={() => setPaused(!paused)}>
          {paused ? <PlayIcon size={10} color={theme.accentInk} /> :
            <svg width="9" height="10" viewBox="0 0 9 10" fill={theme.accentInk}>
              <rect x="1" y="1" width="2.5" height="8" /><rect x="5.5" y="1" width="2.5" height="8" />
            </svg>}
        </CtrlBtn>
        <CtrlBtn theme={theme} onClick={() => {
          if (trackIdx + 1 < sideTracks.length) { setTrackIdx(trackIdx + 1); setElapsed(0); }
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 2,9 7,5" /><rect x="8" y="1" width="1" height="8" /></svg>
        </CtrlBtn>
      </div>

      <Waveform progress={progress} accent={theme.accent} dim={theme.hairlineStrong} />

      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10.5, color: theme.inkMuted,
        letterSpacing: '0.04em', minWidth: 90, textAlign: 'right',
      }}>
        <span style={{ color: theme.ink }}>{fmtDur(elapsed)}</span>
        <span style={{ color: theme.inkDim }}> / {fmtDur(total)}</span>
      </div>

      <button onClick={onClose} style={{
        border: 0, background: 'transparent', color: theme.inkMuted,
        cursor: 'pointer', fontSize: 16, padding: 4,
      }}>×</button>
    </div>
  );
};

const CtrlBtn = ({ children, onClick, theme, accent }) => (
  <button onClick={onClick} style={{
    width: 30, height: 30, borderRadius: '50%',
    border: accent ? 0 : `0.5px solid ${theme.hairlineStrong}`,
    background: accent ? theme.accent : 'transparent',
    color: accent ? theme.accentInk : theme.ink,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>{children}</button>
);

// Expanded — full-screen spinning record over the app
const NowPlayingExpanded = ({ playing, current, trackIdx, setTrackIdx, elapsed, total, progress, paused, setPaused, setElapsed, t, theme, feel, onClose }) => {
  const { album, sideTracks } = playing;
  const [showSleeve, setShowSleeve] = useState(false);
  useEffect(() => { setShowSleeve(false); }, [album.id]);
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 400,
      background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.surface} 100%)`,
      display: 'flex', flexDirection: 'column',
      animation: 'crate-fadein 320ms ease-out',
    }}>
      <div style={{
        padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `0.5px solid ${theme.hairline}`,
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
          color: theme.inkMuted, textTransform: 'uppercase',
        }}>● {t.now_playing}</div>
        <button onClick={onClose} style={{
          background: 'transparent', border: `0.5px solid ${theme.hairline}`,
          padding: '6px 12px', color: theme.inkMuted, cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.10em',
          textTransform: 'uppercase',
        }}>{t.close}</button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 50, padding: 40 }}>
        {/* Cover — flips between disc and sleeve on click */}
        <div
          onClick={() => setShowSleeve((s) => !s)}
          style={{
            position: 'relative', width: 360, height: 360, cursor: 'pointer',
          }}>
          <div style={{
            position: 'absolute', inset: 0,
            opacity: showSleeve ? 0 : 1,
            transition: 'opacity 320ms ease',
          }}>
            <SpinningDisc album={album} spinning={!paused && !showSleeve} />
          </div>
          <div style={{
            position: 'absolute', inset: 0,
            opacity: showSleeve ? 1 : 0,
            transition: 'opacity 320ms ease',
            boxShadow: showSleeve ? '0 24px 60px rgba(0,0,0,0.6)' : 'none',
          }}>
            <Sleeve album={album} size={360} />
          </div>
          {/* Tonearm — only over the disc */}
          <div style={{
            position: 'absolute', top: -12, right: -16, width: 180, height: 180,
            pointerEvents: 'none',
            transform: `rotate(${20 + progress * 18}deg)`,
            transformOrigin: 'top right',
            transition: 'transform 1s linear, opacity 280ms',
            opacity: showSleeve ? 0 : 1,
          }}>
            <svg viewBox="0 0 180 180">
              <circle cx="170" cy="10" r="6" fill={theme.surface} stroke={theme.hairlineStrong} />
              <line x1="170" y1="10" x2="40" y2="120" stroke={theme.inkMuted} strokeWidth="2.5" />
              <rect x="32" y="116" width="14" height="10" fill={theme.surface2} stroke={theme.hairlineStrong} />
            </svg>
          </div>
          {/* Click hint */}
          <div style={{
            position: 'absolute', bottom: -28, left: 0, right: 0, textAlign: 'center',
            fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.16em',
            color: theme.inkDim, textTransform: 'uppercase', pointerEvents: 'none',
          }}>
            {showSleeve ? '◉ klikk for spinnande plate' : '▣ klikk for omslag'}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: theme.accent,
              letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8,
            }}>{current.pos} · {t.side} {current.pos.charAt(0)}</div>
            <h2 style={{
              fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
              fontSize: feel.titleSerif ? 40 : 28,
              fontWeight: feel.titleSerif ? 500 : 600,
              fontStyle: feel.titleSerif ? 'italic' : 'normal',
              letterSpacing: feel.titleSerif ? '0.005em' : '-0.02em',
              color: theme.ink, margin: '0 0 8px', lineHeight: 1.1,
            }}>{current.title}</h2>
            <div style={{ fontFamily: 'var(--ui)', fontSize: 14, color: theme.inkMuted }}>
              {album.artist} — {album.title}
            </div>
          </div>

          <Waveform progress={progress} accent={theme.accent} dim={theme.hairlineStrong} n={90} />

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--mono)', fontSize: 11, color: theme.inkMuted, letterSpacing: '0.04em',
          }}>
            <span style={{ color: theme.ink }}>{fmtDur(elapsed)}</span>
            <span>−{fmtDur(total - elapsed)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <CtrlBtn theme={theme} onClick={() => { setTrackIdx(Math.max(0, trackIdx - 1)); setElapsed(0); }}>
              <svg width="11" height="11" viewBox="0 0 10 10" fill="currentColor"><polygon points="8,1 8,9 3,5" /><rect x="1" y="1" width="1" height="8" /></svg>
            </CtrlBtn>
            <button onClick={() => setPaused(!paused)} style={{
              width: 56, height: 56, borderRadius: '50%',
              background: theme.accent, color: theme.accentInk,
              border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {paused ? <PlayIcon size={16} color={theme.accentInk} /> :
                <svg width="14" height="16" viewBox="0 0 14 16" fill={theme.accentInk}>
                  <rect x="2" y="2" width="3.5" height="12" /><rect x="8.5" y="2" width="3.5" height="12" />
                </svg>}
            </button>
            <CtrlBtn theme={theme} onClick={() => {
              if (trackIdx + 1 < sideTracks.length) { setTrackIdx(trackIdx + 1); setElapsed(0); }
            }}>
              <svg width="11" height="11" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 2,9 7,5" /><rect x="8" y="1" width="1" height="8" /></svg>
            </CtrlBtn>
          </div>

          {/* tracklist mini */}
          <div style={{
            marginTop: 12,
            padding: '12px 0', borderTop: `0.5px solid ${theme.hairline}`,
            maxHeight: 130, overflow: 'auto',
          }}>
            {sideTracks.map((tr, i) => (
              <div key={i}
                onClick={() => { setTrackIdx(i); setElapsed(0); }}
                style={{
                  display: 'flex', gap: 10, padding: '5px 0', cursor: 'pointer',
                  color: i === trackIdx ? theme.accent : theme.inkMuted,
                  fontSize: 12, fontFamily: 'var(--ui)',
                }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, minWidth: 24 }}>{tr.pos}</span>
                <span style={{ flex: 1 }}>{tr.title}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{tr.dur}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Side panel
const NowPlayingSide = ({ playing, current, trackIdx, setTrackIdx, elapsed, total, progress, paused, setPaused, setElapsed, t, theme, feel, onClose }) => {
  const { album, sideTracks } = playing;
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 320, background: theme.surface,
      borderLeft: `0.5px solid ${theme.hairlineStrong}`,
      display: 'flex', flexDirection: 'column',
      zIndex: 400,
      animation: 'crate-slidein-right 260ms cubic-bezier(.2,.7,.2,1)',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        padding: '14px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `0.5px solid ${theme.hairline}`,
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
          color: theme.accent, textTransform: 'uppercase',
        }}>● {t.now_playing}</div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 0, color: theme.inkMuted,
          cursor: 'pointer', fontSize: 16,
        }}>×</button>
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ aspectRatio: '1/1', boxShadow: '0 16px 36px rgba(0,0,0,0.5)' }}>
          <Cover album={album} initial="sleeve" spinning={!paused} theme={theme} />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 9.5, color: theme.accent,
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4,
          }}>{current.pos}</div>
          <h3 style={{
            fontFamily: feel.titleSerif ? 'var(--display)' : 'var(--ui)',
            fontSize: feel.titleSerif ? 22 : 18,
            fontWeight: feel.titleSerif ? 500 : 600,
            fontStyle: feel.titleSerif ? 'italic' : 'normal',
            margin: 0, color: theme.ink, lineHeight: 1.15,
          }}>{current.title}</h3>
          <div style={{ fontFamily: 'var(--ui)', fontSize: 12, color: theme.inkMuted, marginTop: 3 }}>
            {album.artist}
          </div>
        </div>
        <Waveform progress={progress} accent={theme.accent} dim={theme.hairlineStrong} n={50} />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--mono)', fontSize: 10, color: theme.inkMuted,
        }}>
          <span style={{ color: theme.ink }}>{fmtDur(elapsed)}</span>
          <span>{fmtDur(total)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <CtrlBtn theme={theme} onClick={() => { setTrackIdx(Math.max(0, trackIdx - 1)); setElapsed(0); }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="8,1 8,9 3,5" /><rect x="1" y="1" width="1" height="8" /></svg>
          </CtrlBtn>
          <button onClick={() => setPaused(!paused)} style={{
            width: 44, height: 44, borderRadius: '50%',
            background: theme.accent, color: theme.accentInk,
            border: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {paused ? <PlayIcon size={12} color={theme.accentInk} /> :
              <svg width="11" height="12" viewBox="0 0 11 12" fill={theme.accentInk}>
                <rect x="1" y="1" width="3" height="10" /><rect x="7" y="1" width="3" height="10" />
              </svg>}
          </button>
          <CtrlBtn theme={theme} onClick={() => {
            if (trackIdx + 1 < sideTracks.length) { setTrackIdx(trackIdx + 1); setElapsed(0); }
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 2,9 7,5" /><rect x="8" y="1" width="1" height="8" /></svg>
          </CtrlBtn>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 18px 18px' }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em',
          color: theme.inkDim, textTransform: 'uppercase', margin: '8px 0',
        }}>{t.side} {sideTracks[0]?.pos.charAt(0)}</div>
        {sideTracks.map((tr, i) => (
          <div key={i}
            onClick={() => { setTrackIdx(i); setElapsed(0); }}
            style={{
              display: 'flex', gap: 8, padding: '6px 0', cursor: 'pointer',
              borderTop: i > 0 ? `0.5px solid ${theme.hairline}` : 'none',
              color: i === trackIdx ? theme.accent : theme.ink,
              fontSize: 12, fontFamily: 'var(--ui)',
            }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, minWidth: 22, color: theme.inkDim }}>{tr.pos}</span>
            <span style={{ flex: 1 }}>{tr.title}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: theme.inkDim }}>{tr.dur}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Main App component
const CrateApp = ({
  direction = 'studio', dark = true, language = 'nn',
  density = 'comfortable', typePairing = 'classic',
  nowPlayingStyle = 'bar', accentOverride = null,
  reflection = false,
  albums: albumsProp = null,
  onOpenSettings = null,
  forceState = null, // 'empty' | 'offline' | null
}) => {
  const dirSpec = DIRECTIONS[direction] || DIRECTIONS.studio;
  const themeBase = dark ? dirSpec.dark : dirSpec.light;
  const theme = accentOverride ? { ...themeBase, accent: accentOverride } : themeBase;
  const feel = dirSpec.feel;
  const t = I18N[language] || I18N.nn;
  const typePair = TYPE_PAIRINGS[typePairing] || TYPE_PAIRINGS.classic;

  const [view, setView] = useState('flip');
  const [sort, setSort] = useState('artist');
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(8);
  const [open, setOpen] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [syncing, setSyncing] = useState(true);
  const [width, setWidth] = useState(1280);
  const rootRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setSyncing(false), 8000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = width < 720;
  const veryNarrow = width < 480;
  // On narrow, the side/expanded styles are forced to the bottom bar
  const effectiveNpStyle = narrow ? 'bar' : nowPlayingStyle;
  const baseAlbums = albumsProp || CRATE_COLLECTION;

  const filtered = useMemo(() => {
    let list = baseAlbums;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.artist.toLowerCase().includes(q) || a.title.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      if (sort === 'artist') return (a.artistsSort || a.artist).localeCompare(b.artistsSort || b.artist);
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'year') return a.year - b.year;
      return 0;
    });
    return list;
  }, [search, sort, baseAlbums]);

  const isEmpty = forceState === 'empty' || (baseAlbums.length === 0);
  const isOffline = forceState === 'offline';
  const isNoResults = !isEmpty && !isOffline && filtered.length === 0 && search.length > 0;

  return (
    <div ref={rootRef} style={{
      width: '100%', height: '100%',
      background: theme.bg, color: theme.ink,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      ['--display']: typePair.display,
      ['--ui']: typePair.ui,
      ['--mono']: typePair.mono,
      fontFamily: typePair.ui,
    }}>
      <Header t={t} theme={theme} feel={feel}
        count={baseAlbums.length} view={view} setView={setView}
        search={search} setSearch={setSearch} sort={sort} setSort={setSort}
        syncing={syncing && !isEmpty && !isOffline}
        onOpenSettings={onOpenSettings}
        narrow={narrow}
      />

      {isEmpty ? (
        <EmptyState theme={theme} feel={feel}
          icon={<EmptyCrateGlyph color={theme.inkDim} />}
          title={t.empty_collection_title} sub={t.empty_collection_sub}
        />
      ) : isOffline ? (
        <EmptyState theme={theme} feel={feel}
          icon={<OfflineGlyph color={theme.accent} />}
          title={t.offline_title} sub={t.offline_sub}
          action={
            <button style={{
              padding: '10px 18px', marginTop: 6,
              background: theme.accent, color: theme.accentInk, border: 0, cursor: 'pointer',
              fontFamily: feel.uppercase ? 'var(--mono)' : 'var(--ui)',
              fontSize: feel.uppercase ? 11 : 13,
              letterSpacing: feel.uppercase ? '0.12em' : '0.01em',
              textTransform: feel.uppercase ? 'uppercase' : 'none',
              fontWeight: 600,
            }}>{t.retry}</button>
          }
        />
      ) : isNoResults ? (
        <EmptyState theme={theme} feel={feel}
          icon={<NoResultsGlyph color={theme.inkDim} />}
          title={t.no_results_title} sub={t.no_results_sub}
        />
      ) : view === 'flip' ? (
        <FlipThrough albums={filtered} focused={Math.min(focused, filtered.length - 1)}
          setFocused={setFocused} onOpen={setOpen} theme={theme} feel={feel}
          density={density} t={t} reflection={reflection} narrow={narrow} />
      ) : (
        <GridView albums={filtered} onOpen={setOpen} theme={theme} feel={feel} density={density} />
      )}

      {open && (
        <RecordModal album={open} t={t} theme={theme} feel={feel}
          narrow={narrow}
          onClose={() => setOpen(null)}
          onPlay={(p) => { setPlaying(p); setOpen(null); }}
        />
      )}

      {playing && (
        <NowPlayingBar playing={playing} t={t} theme={theme} feel={feel}
          style={effectiveNpStyle}
          onClose={() => setPlaying(null)}
        />
      )}

      {/* film-grain overlay */}
      {theme.grain > 0 && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          opacity: theme.grain, mixBlendMode: 'overlay',
          backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"200\\" height=\\"200\\"><filter id=\\"n\\"><feTurbulence baseFrequency=\\"0.9\\" numOctaves=\\"2\\"/></filter><rect width=\\"200\\" height=\\"200\\" filter=\\"url(%23n)\\"/></svg>")',
        }} />
      )}
    </div>
  );
};

window.CrateApp = CrateApp;
